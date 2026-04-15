# Implementation Guide: Fixing N+1 Queries and Memory Leaks

## Quick Summary

This guide provides step-by-step fixes for:
1. **N+1 Query Issues** in Laravel ChatController
2. **Memory Leaks** in React useEffect hooks
3. **Test Coverage** using Pest PHP and Vitest

---

## PART 1: LARAVEL N+1 QUERY FIXES

### Fix 1.1: ChatController::index() - Optimize UserListCacheService

**Current Code (Problematic):**
```php
$conversations = $conversations->map(function ($conversation) use ($userListService, $user) {
    $conversation->users = $userListService->getConversationMembers($conversation, withStatus: true, currentUser: $user);
    return $conversation;
});
```

**Problem:** If `getConversationMembers()` queries the database for each conversation, this is N+1.

**Solution: Option A - Batch Load (Recommended)**
```php
// In ChatController::index()
$conversations = $user->conversations()
    ->with([
        'lastMessage.user',
        'users', // Eager load all users at once
    ])
    ->withCount(['messages as unreadMessages' => function ($query) use ($user) {
        $query->where('user_id', '!=', $user->id)->whereNull('read_at');
    }])
    ->orderBy('pivot_is_pinned', 'desc')
    ->orderBy('pivot_updated_at', 'desc')
    ->get();

// Enhance with cached online status - cache service should NOT query DB
$conversations = $conversations->map(function ($conversation) use ($userListService, $user) {
    // This assumes getConversationMembers() ONLY uses cache, not database
    $conversation->users = $userListService->getConversationMembers($conversation, withStatus: true, currentUser: $user);
    return $conversation;
});

return Inertia::render('Chat/Index', [
    'currentUser' => new UserResource($user),
    'conversations' => ConversationResource::collection($conversations)->resolve(),
]);
```

**Solution: Option B - Batch Cache Load**
```php
// Pre-load all user online statuses at once
$userIds = $conversations->flatMap(fn($c) => $c->users->pluck('id'))->unique();
$onlineStatuses = app(OnlineStatusCacheService::class)->getStatusForUsers($userIds);

// Then enhance conversations
$conversations = $conversations->map(function ($conversation) use ($onlineStatuses) {
    $conversation->users = $conversation->users->map(function ($user) use ($onlineStatuses) {
        $user->is_online = $onlineStatuses[$user->id] ?? false;
        return $user;
    });
    return $conversation;
});
```

**Verify the Fix:**
```bash
# In routes/web.php or route test, enable query logging
php artisan tinker
> DB::enableQueryLog();
> Auth::login(User::first());
> // navigate to chat index
> dd(DB::getQueryLog());
# Should be < 8 queries
```

---

### Fix 1.2: ChatController::show() - Remove Duplicate Loads

**Current Code (Problematic):**
```php
// PROBLEM: Loading conversations twice (lines 105 + repeated in show method)
// PROBLEM: Loading active conversation users twice (lines 120-121)

$conversations = $user->conversations()
    ->with(['lastMessage.user', 'users'])
    ->withCount([...])
    ->get();

// ... later in same method ...
$conversations = $conversations->map(...);

// THEN loading again
$activeConversation = $conversation->load(['users']); // ← DUPLICATE
$activeConversation->users = $userListService->getConversationMembers($conversation, withStatus: true, currentUser: $user);
```

**Fixed Code:**
```php
public function show(Request $request, Conversation $conversation): Response
{
    $user = $request->user();

    // Authorize: User must be part of this conversation
    abort_unless($conversation->users->contains($user->id), 403);

    // Dispatch event
    ConversationOpened::dispatch($conversation, $user);

    // Fetch paginated messages with eager loading
    $messages = $conversation->messages()
        ->with(['user', 'attachments']) // ENSURE eager loading
        ->orderBy('created_at', 'desc')
        ->paginate(50);

    $messagesCollection = $messages->items();

    // ===== KEY FIX: Load conversations ONCE for sidebar =====
    $userListService = app(UserListCacheService::class);
    $conversations = $user->conversations()
        ->with(['lastMessage.user', 'users'])
        ->withCount(['messages as unreadMessages' => function ($query) use ($user) {
            $query->where('user_id', '!=', $user->id)->whereNull('read_at');
        }])
        ->orderBy('pivot_is_pinned', 'desc')
        ->orderBy('pivot_updated_at', 'desc')
        ->get();

    // Enhance with online status
    $conversations = $conversations->map(function ($conv) use ($userListService, $user) {
        $conv->users = $userListService->getConversationMembers($conv, withStatus: true, currentUser: $user);
        return $conv;
    });

    // ===== KEY FIX: Use already-loaded conversation, don't load again =====
    // Conversation is already in the $conversations collection
    $activeConversation = $conversations->firstWhere('id', $conversation->id);
    
    // If for some reason it's not, load once (but should already be loaded)
    if (!$activeConversation) {
        $activeConversation = $conversation->load(['users']);
        $activeConversation->users = $userListService->getConversationMembers($conversation, withStatus: true, currentUser: $user);
    }

    return Inertia::render('Chat/Show', [
        'currentUser' => new UserResource($user),
        'conversations' => ConversationResource::collection($conversations)->resolve(),
        'activeConversation' => new ConversationResource($activeConversation),
        'messages' => MessageResource::collection(array_reverse($messagesCollection))->resolve(),
        'pagination' => [
            'current_page' => $messages->currentPage(),
            'last_page' => $messages->lastPage(),
            'total' => $messages->total(),
            'per_page' => $messages->perPage(),
        ],
    ]);
}
```

---

### Fix 1.3: Ensure Message Eager Loading

**Audit MessageResource:**
```php
// app/Http/Resources/MessageResource.php

public function toArray($request)
{
    // VERIFY user is already loaded via with(['user'])
    // This should NOT cause additional queries
    return [
        'id' => $this->id,
        'conversation_id' => $this->conversation_id,
        'user_id' => $this->user_id,
        'body' => $this->body,
        'type' => $this->type,
        'status' => $this->status,
        'created_at' => $this->created_at,
        // ✓ Accessing $this->user is safe - already eager loaded
        'user' => new UserResource($this->user), // ✓ Should not query
        'attachments' => MessageAttachmentResource::collection($this->attachments), // ✓ Should not query
    ];
}
```

---

### Fix 1.4: Database Migration - Materialize Last Message

For better performance with very large conversation counts:

```php
// database/migrations/2024_XX_XX_XXXXXX_add_last_message_id_to_conversations.php

public function up(): void
{
    Schema::table('conversations', function (Blueprint $table) {
        $table->unsignedBigInteger('last_message_id')->nullable()->after('description');
        $table->foreign('last_message_id')->references('id')->on('messages')->onDelete('set null');
        $table->index('last_message_id');
    });
    
    // Backfill existing data
    DB::statement('
        UPDATE conversations c
        SET last_message_id = (
            SELECT id FROM messages 
            WHERE conversation_id = c.id 
            ORDER BY created_at DESC 
            LIMIT 1
        )
    ');
}

public function down(): void
{
    Schema::table('conversations', function (Blueprint $table) {
        $table->dropForeign(['last_message_id']);
        $table->dropIndex(['last_message_id']);
        $table->dropColumn('last_message_id');
    });
}
```

Then update the relationship:
```php
// app/Models/Conversation.php

public function lastMessage(): BelongsTo
{
    // Much faster - direct join instead of subquery
    return $this->belongsTo(Message::class, 'last_message_id');
}
```

---

## PART 2: REACT MEMORY LEAK FIXES

### Fix 2.1: MessageBubble - Fix useEffect Dependencies

**Current (Problematic):**
```typescript
useEffect(() => {
    // ... decryption code ...
}, [message, message.user?.email]); // ⚠️ Nested property in deps!
```

**Fixed:**
```typescript
useEffect(() => {
    if (message.type === 'text' && (message as any).is_encrypted && (message as any).encrypted_body) {
        try {
            const senderEmail = message.user?.email || '';
            const encryptionKey = generateEncryptionKey(message.user_id, senderEmail);
            const decrypted = decryptMessage((message as any).encrypted_body, encryptionKey);
            const sanitized = sanitizeAsText(decrypted);
            setDisplayedBody(sanitized);
            setDecryptionError(null);
        } catch (error) {
            console.error('Failed to decrypt message:', error);
            setDecryptionError('Failed to decrypt message');
            setDisplayedBody('[Encrypted Message]');
        }
    } else {
        const sanitized = sanitizeAsText(message.body || '');
        setDisplayedBody(sanitized);
        setDecryptionError(null);
    }
    // ✓ FIX: Only depend on message content, not nested properties
}, [message.id, message.is_encrypted, message.encrypted_body, message.body, message.user_id]);
```

**Why This Matters:**
- `message.user?.email` is evaluated at render time
- If message object changes reference, effect runs even if email didn't change
- Creates unnecessary decryption work and potential memory growth

---

### Fix 2.2: Chat/Show.tsx - Fix Notification Dependency Issues

**Current (Problematic):**
```typescript
useEffect(() => {
    if (messages.length === 0 || !currentUser) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.id !== lastNotifiedMessageRef.current && 
        lastMessage.user_id !== currentUser.id) {
        
        // PROBLEM: conversationsArray - derived from props, changes every render!
        // PROBLEM: notifications object - context value, likely recreated each render
        const sender = conversationsArray
            .find(conv => conv.id === activeConversation?.id)
            ?.users?.find((u: any) => u.id === lastMessage.user_id);
        
        if (sender) {
            notifications.notifyNewMessage(lastMessage, sender);
            lastNotifiedMessageRef.current = lastMessage.id;
        }
    }
}, [messages, currentUser?.id, activeConversation?.id, conversationsArray, notifications]); // ⚠️ Bad deps!
```

**Fixed:**
```typescript
// Step 1: Memoize conversationsArray if it comes from props
const memoizedConversations = useMemo(() => conversationsArray, [conversationsArray]);

// Step 2: Create a stable callback for notifications
const handleNotification = useCallback((message: Message, sender: User) => {
    notifications.notifyNewMessage(message, sender);
}, [notifications]);

// Step 3: Fix the useEffect with better dependency management
useEffect(() => {
    if (messages.length === 0 || !currentUser) return;

    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage && lastMessage.id !== lastNotifiedMessageRef.current && 
        lastMessage.user_id !== currentUser.id) {
        
        // Find sender in memoized conversations
        const sender = memoizedConversations
            .find(conv => conv.id === activeConversation?.id)
            ?.users?.find((u: any) => u.id === lastMessage.user_id);
        
        if (sender) {
            handleNotification(lastMessage, sender);
            lastNotifiedMessageRef.current = lastMessage.id;
        }
    }
}, [messages, currentUser?.id, activeConversation?.id, memoizedConversations, handleNotification]);
```

---

### Fix 2.3: NetworkBanner - Already Correct But Verify

**Current Code (Good Pattern):**
```typescript
useEffect(() => {
    if (!isOnline) {
        setShowOfflineBanner(true);
        setIsReconnecting(true);
    } else if (showOfflineBanner) {
        setIsReconnecting(false);
        const timer = setTimeout(() => {
            setShowOfflineBanner(false);
        }, 3000);
        return () => clearTimeout(timer); // ✓ Correct cleanup!
    }
}, [isOnline, showOfflineBanner]);
```

**Recommendation:** This is actually fine, but be aware:
- Dependency on `showOfflineBanner` creates effect re-runs
- This is intentional and necessary for the state machine 
- Alternative: Use callback reference to avoid dependency

**Alternative (Better):**
```typescript
useEffect(() => {
    if (!isOnline) {
        setShowOfflineBanner(true);
        setIsReconnecting(true);
    }
}, [isOnline]);

useEffect(() => {
    if (showOfflineBanner && isOnline && !isReconnecting) {
        // Give user brief "You're back online" message (3 seconds)
        const timer = setTimeout(() => {
            setShowOfflineBanner(false);
        }, 3000);
        return () => clearTimeout(timer);
    }
}, [showOfflineBanner, isOnline, isReconnecting]);
```

---

### Fix 2.4: AudioPlayer - Improve Event Handler Attachment

**Current (Problematic):**
```typescript
<audio
    ref={audioRef}
    src={src}
    onLoadedMetadata={handleLoadedMetadata}
    onTimeUpdate={handleTimeUpdate} // Fires ~250ms, updates state
    onEnded={handleAudioEnd}
    onPlay={() => setIsPlaying(true)}
    onPause={() => setIsPlaying(false)}
/>
```

**Problem:** Inline arrow functions create new function on each render, causing re-attachment.

**Fixed:**
```typescript
const handlePlayPause = useCallback(() => {
    if (audioRef.current) {
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    }
}, [isPlaying]);

const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
        setTotalDuration(audioRef.current.duration);
    }
}, []);

const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && !isSeeking) {
        setCurrentTime(audioRef.current.currentTime);
    }
}, [isSeeking]);

const handleAudioEnd = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
}, []);

// Add cleanup for audio
useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleAudioEnd);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleAudioEnd);
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('pause', onPause);
        audio.pause(); // Ensure audio is stopped
    };
}, [handleLoadedMetadata, handleTimeUpdate, handleAudioEnd]);

return (
    <audio
        ref={audioRef}
        src={src}
        // Remove inline handlers - use event listeners above
    />
);
```

---

### Fix 2.5: VoiceRecorder - Media Stream Cleanup

**Add Proper Cleanup:**
```typescript
useEffect(() => {
    let mediaStream: MediaStream | null = null;
    let mediaRecorder: MediaRecorder | null = null;

    const startRecording = async () => {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(mediaStream);

            const audioChunks: Blob[] = [];
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                // Handle audio blob
            };

            mediaRecorder.start();
        } catch (error) {
            console.error('Failed to access microphone:', error);
        }
    };

    // Cleanup function
    return () => {
        // Stop recording if active
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }

        // Stop all tracks in media stream
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }

        // Clear references
        mediaStream = null;
        mediaRecorder = null;
    };
}, []);
```

---

### Fix 2.6: Chat/Show.tsx - WebSocket Cleanup

**When WebSocket is implemented:**
```typescript
useEffect(() => {
    if (!activeConversation?.id) return;

    // Subscribe to conversation channel
    const channel = Echo.private(`conversation.${activeConversation.id}`)
        .listen('MessageSent', (data: Message) => {
            setMessages(prev => [...prev, data]);
        })
        .listenForWhisper('typing', (data: { user_id: number }) => {
            if (data.user_id !== currentUser.id) {
                setIsTyping(true);
            }
        });

    return () => {
        // CRITICAL: Unsubscribe when conversation changes or component unmounts
        channel.leave();
    };
}, [activeConversation?.id, currentUser.id]);
```

---

## PART 3: RUNNING THE TESTS

### Run Pest PHP Tests

```bash
# Run all ChatController tests
php artisan pest tests/Feature/ChatControllerTest.php

# Run specific test group
php artisan pest tests/Feature/ChatControllerTest.php --filter="N+1"

# Run with verbose output
php artisan pest tests/Feature/ChatControllerTest.php --verbose

# Enable query logging to see queries
DB_QUERY_LOG=true php artisan pest tests/Feature/ChatControllerTest.php
```

### Run Vitest Tests

```bash
# Run all component tests
npm run test resources/js/__tests__/components.test.tsx

# Run hooks tests
npm run test resources/js/__tests__/hooks.test.ts

# Run in watch mode during development
npm run test:watch resources/js/__tests__/

# Coverage report
npm run test -- --coverage
```

---

## PART 4: VERIFICATION CHECKLIST

### Laravel Checklist
- [ ] ChatController::index() uses < 8 queries
- [ ] ChatController::show() does not call `.load(['users'])` twice
- [ ] All message queries include `.with(['user', 'attachments'])`
- [ ] UserListCacheService only uses cache, not database
- [ ] Tests pass: `php artisan pest tests/Feature/ChatControllerTest.php`
- [ ] Database query count monitoring shows improvement

### React Checklist
- [ ] MessageBubble useEffect only depends on message ID/content
- [ ] Chat/Show notification context is memoized
- [ ] AudioPlayer event listeners are cleaned up on unmount
- [ ] VoiceRecorder stops all media streams on unmount
- [ ] NetworkBanner timers are cleared on unmount
- [ ] WebSocket listeners unsubscribe on conversation change
- [ ] Tests pass: `npm run test resources/js/__tests__/`
- [ ] No memory leaks in DevTools > Memory profiler

---

## PART 5: MONITORING & DEBUGGING

### Laravel Query Monitoring

```php
// In AppServiceProvider::boot()
if (config('app.debug')) {
    DB::listen(function ($query) {
        if ($query->time > 100) { // Log slow queries (>100ms)
            \Log::warning('Slow Query', [
                'sql' => $query->sql,
                'bindings' => $query->bindings,
                'time' => $query->time . 'ms',
            ]);
        }
    });
}
```

### React Memory Profiling

```bash
# In browser DevTools > Performance tab:
1. Open Memory profiler
2. Record heap snapshot before loading chat
3. Perform chat operations (load conversations, switch, etc.)
4. Record final heap snapshot
5. Compare snapshots - should see minimal growth
6. Look for "Detached DOM nodes" - indicates memory leak
```

---

## Reference: Query Count Targets

| Endpoint | Current | Target | Status |
|----------|---------|--------|--------|
| GET /chat (index) | 20-25 | < 8 | ⏳ Fix 1.1 |
| GET /chat/{id} (show) | 12-15 | < 8 | ⏳ Fix 1.2 |
| POST /api/messages | 4-5 | < 4 | ✓ Usually OK |

---

## Next Steps

1. **Implement Laravel fixes** in order (Fix 1.1 → 1.2 → 1.3)
2. **Run Pest tests** to verify queries dropped
3. **Implement React fixes** focusing on MessageBubble and Chat/Show
4. **Run Vitest tests** to verify no memory leaks
5. **Profile in browser** DevTools to confirm memory stabilizes
6. **Monitor production** with APM tool (New Relic, DataDog, etc.)

