<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use App\Http\Resources\UserResource;
use App\Events\MessageSent;
use App\Events\ConversationOpened;
use App\Events\UpdateUserPresence;
use App\Services\OnlineStatusCacheService;
use App\Services\UserListCacheService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * ChatController - Handles chat-related operations
 * 
 * Manages conversations, messages, and Inertia page rendering
 */
class ChatController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of all conversations for the authenticated user.
     * 
     * Uses Redis caching to optimize user list and online status queries,
     * reducing PostgreSQL load for high-traffic applications.
     * 
     * Eager Loading Strategy:
     * - lastMessage.user: Avoid N+1 when fetching last message sender
     * - users: Avoid N+1 when displaying conversation members
     * - messages count for unread count: Calculated via withCount instead of separate queries
     * 
     * @param Request $request
     * @return Response
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Fetch conversations with last message and participants
        // Sorted by pinned (pinned first), then by most recent activity
        // Eager load all relationships to prevent N+1 queries
        $conversations = $user->conversations()
            ->with([
                'lastMessage.user:id,name,avatar',      // Load only needed columns for performance
                'users:id,name,avatar,phone,bio',       // Avoid loading password and sensitive fields
            ])
            ->withCount(['messages as unreadMessages' => function ($query) use ($user) {
                // Count messages that haven't been read by this user
                // Uses the new indexes for fast counting
                $query->where('user_id', '!=', $user->id)
                    ->whereNull('read_at');
            }])
            ->orderByPivot('is_pinned', 'desc')
            ->orderByPivot('updated_at', 'desc')
            ->get();

        // Enhance with cached online status
        // This maps fresh data from cache instead of making new queries
        $userListService = app(UserListCacheService::class);
        $conversations = $conversations->map(function ($conversation) use ($userListService, $user) {
            // Get conversation members with online status from cache
            // Pass current user to check blocking relationships
            $conversation->users = $userListService->getConversationMembers($conversation, withStatus: true, currentUser: $user);
            return $conversation;
        });

        return Inertia::render('Chat/Index', [
            'currentUser' => new UserResource($user),
            'conversations' => ConversationResource::collection($conversations)->resolve(),
        ]);
    }

    /**
     * Display a specific conversation with paginated messages.
     * 
     * Optimized with Redis caching for online status and user lists.
     * 
     * Eager Loading Strategy:
     * - Paginated messages with user and attachments: Prevents N+1 on message sender/attachments
     * - Sidebar conversations: Reuses same pattern as index() for consistency
     * - Active conversation users: Only loaded once via authorization, reused for cache mapping
     * 
     * @param Request $request
     * @param Conversation $conversation
     * @return Response
     */
    public function show(Request $request, Conversation $conversation): Response
    {
        $user = $request->user();

        // Authorize AND eagerly load users in one operation
        // This prevents the "load after check" anti-pattern that causes duplicate queries
        $conversation->load('users');
        abort_unless($conversation->users->contains($user->id), 403);

        // Dispatch ConversationOpened event to mark received messages as delivered
        ConversationOpened::dispatch($conversation, $user);

        // Fetch paginated messages with eager loaded relationships
        // Uses new composite indexes (conversation_id, created_at) for optimal pagination
        $messages = $conversation->messages()
            ->with([
                'user:id,name,avatar,phone,bio',           // Avoid N+1 on message sender
                'attachments:id,message_id,file_name,path,mime_type,type,size'    // Avoid N+1 on attachments
            ])
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        // Reverse to show oldest first on frontend
        $messagesCollection = $messages->items();

        // Fetch all conversations for sidebar with same eager loading strategy as index()
        $userListService = app(UserListCacheService::class);
        $conversations = $user->conversations()
            ->with([
                'lastMessage.user:id,name,avatar',        // Avoid N+1 on last message sender
                'users:id,name,avatar,phone,bio'          // Avoid N+1 on conversation members
            ])
            ->withCount(['messages as unreadMessages' => function ($query) use ($user) {
                $query->where('user_id', '!=', $user->id)
                    ->whereNull('read_at');
            }])
            ->orderByPivot('is_pinned', 'desc')
            ->orderByPivot('updated_at', 'desc')
            ->get();

        // Enhance conversations with cached online status
        $conversations = $conversations->map(function ($conv) use ($userListService, $user) {
            $conv->users = $userListService->getConversationMembers($conv, withStatus: true, currentUser: $user);
            return $conv;
        });

        // Enhance active conversation with cached online status
        // Reuse already-loaded conversation.users instead of calling load() again
        $conversation->users = $userListService->getConversationMembers($conversation, withStatus: true, currentUser: $user);

        return Inertia::render('Chat/Show', [
            'currentUser' => new UserResource($user),
            'conversations' => ConversationResource::collection($conversations)->resolve(),
            'activeConversation' => new ConversationResource($conversation),
            'messages' => MessageResource::collection(array_reverse($messagesCollection))->resolve(),
            'pagination' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'total' => $messages->total(),
                'per_page' => $messages->perPage(),
            ],
        ]);
    }

    /**
     * Store a new message in a conversation.
     * 
     * Enforces MessagePolicy to prevent blocked users from messaging.
     * Supports encrypted messages and ephemeral (disappearing) messages.
     * 
     * @param Request $request
     * @param Conversation $conversation
     * @return JsonResponse
     */
    public function store(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();

        // Authorize: Check if user is allowed to send messages (blocked users cannot)
        // This also checks if user is part of conversation and not blocked by members
        $this->authorize('create', $conversation);

        // Validate input
        $validated = $request->validate([
            'body' => 'nullable|string|max:5000',
            'encrypted_body' => 'nullable|string',
            'is_encrypted' => 'nullable|boolean',
            'is_ephemeral' => 'nullable|boolean',
            'file' => 'nullable|file|max:52428800', // 50MB max
        ]);

        // At least body OR file must be provided
        if (empty($validated['body']) && empty($validated['encrypted_body']) && !$request->hasFile('file')) {
            return response()->json([
                'message' => 'Message body or file is required',
            ], 422);
        }

        // Determine message type
        $type = 'text';
        $filePath = null;
        $fileSize = null;
        $mimeType = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $mimeType = $file->getMimeType();
            
            // Determine type based on MIME type
            if (str_starts_with($mimeType, 'image/')) {
                $type = 'image';
            } elseif (str_starts_with($mimeType, 'audio/')) {
                $type = 'audio';
            } elseif (str_starts_with($mimeType, 'video/')) {
                $type = 'video';
            } else {
                $type = 'file';
            }
            
            // Store file
            $filePath = $file->store('messages', 'public');
            $fileSize = $file->getSize();
            $mimeType = $file->getMimeType();
        }

        // Create message with encryption and ephemeral support
        $messageData = [
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
            'body' => $validated['body'] ?? '',
            'encrypted_body' => $validated['encrypted_body'] ?? null,
            'is_encrypted' => $validated['is_encrypted'] ?? false,
            'type' => $type,
            'status' => 'sent',
            'file_path' => $filePath,
            'file_size' => $fileSize,
            'mime_type' => $mimeType,
            'is_ephemeral' => $validated['is_ephemeral'] ?? false,
        ];

        // Set disappears_at if ephemeral
        if ($validated['is_ephemeral'] ?? false) {
            $messageData['disappears_at'] = now()->addHours(24);
        }

        $message = Message::create($messageData);

        // Load user relationship for response
        $message->load(['user', 'attachments']);

        // Update conversation's updated_at timestamp
        $conversation->touch();

        // Update the pivot's updated_at for proper sorting
        $conversation->users()->updateExistingPivot($user->id, [
            'updated_at' => now(),
        ]);

        // Invalidate message pagination cache for this conversation
        cache()->tags(["conversation.{$conversation->id}.messages"])->flush();

        // Broadcast message to all conversation members in real-time via Reverb
        MessageSent::dispatch($message);

        return response()->json(new MessageResource($message), 201);
    }

    /**
     * Update user presence in a conversation.
     * 
     * Updates last_seen timestamp and caches online status in Redis
     * to minimize database queries.
     * Broadcasts to presence channel to notify other users.
     * 
     * @param Request $request
     * @param Conversation $conversation
     * @return JsonResponse
     */
    public function updatePresence(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();

        // Authorize: User must be part of this conversation
        abort_unless($conversation->users->contains($user->id), 403);

        // Update last_seen timestamp
        $user->update(['last_seen' => now()]);

        // Update cached online status via Redis
        $onlineStatusService = app(OnlineStatusCacheService::class);
        $onlineStatusService->updateStatus($user);

        // Invalidate user list caches for this conversation
        $userListService = app(UserListCacheService::class);
        $userListService->invalidateConversationCache($conversation);

        // Broadcast user joined event
        UpdateUserPresence::dispatch($user, $conversation->id, true);

        return response()->json([
            'message' => 'Presence updated',
            'user' => new UserResource($user),
        ]);
    }

    /**
     * Global search across conversations and messages.
     * Searches by:
     * - User names (for group conversations)
     * - Other user names (for 1-on-1 conversations)
     * - Message content
     * 
     * Eager Loading Strategy:
     * - Searches use indexed columns (name, body) for fast database lookups
     * - Eager load relationships to minimize N+1 queries in result processing
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function globalSearch(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = $request->query('q', '');

        if (strlen($query) < 2) {
            return response()->json([
                'conversations' => [],
                'messages' => [],
            ]);
        }

        // Get user's conversation IDs - single query
        $conversationIds = $user->conversations()
            ->pluck('conversation_id')
            ->toArray();

        if (empty($conversationIds)) {
            return response()->json([
                'conversations' => [],
                'messages' => [],
            ]);
        }

        // Search by conversation name - eager load relationships to prevent N+1
        $conversationsByName = Conversation::where('is_group', true)
            ->whereIn('id', $conversationIds)
            ->where('name', 'like', "%{$query}%")
            ->with([
                'lastMessage:id,conversation_id,user_id,body,type,created_at',
                'lastMessage.user:id,name,avatar',
                'users:id,name,avatar'
            ])
            ->limit(10)
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'name' => $c->name,
                    'display_name' => $c->name,
                    'type' => 'group',
                    'avatar' => $c->avatar,
                    'last_message' => $c->lastMessage,
                ];
            });

        // Search by user names in one-on-one conversations
        // Eager load relationships once to avoid N+1
        $conversationsByUser = Conversation::where('is_group', false)
            ->whereIn('id', $conversationIds)
            ->with('users:id,name,avatar,phone,bio')
            ->get()
            ->filter(function ($conversation) use ($user, $query) {
                $otherUser = $conversation->users->first(function ($u) use ($user) {
                    return $u->id !== $user->id;
                });
                return $otherUser && stripos($otherUser->name, $query) !== false;
            })
            ->map(function ($c) use ($user) {
                $otherUser = $c->users->first(function ($u) use ($user) {
                    return $u->id !== $user->id;
                });
                return [
                    'id' => $c->id,
                    'name' => $otherUser->name ?? 'Unknown',
                    'display_name' => $otherUser->name ?? 'Unknown',
                    'type' => 'direct',
                    'avatar' => $otherUser->avatar ?? null,
                    'last_message' => $c->lastMessage ?? null,
                ];
            });

        // Merge and deduplicate conversations
        $allConversations = collect($conversationsByName)
            ->merge($conversationsByUser)
            ->unique('id')
            ->values()
            ->take(10);

        // Search in messages - eager load user to prevent N+1
        // Uses indexed (conversation_id, created_at) for fast text search
        $messages = Message::whereIn('conversation_id', $conversationIds)
            ->where('body', 'like', "%{$query}%")
            ->where('type', 'text')
            ->with([
                'user:id,name,avatar,phone,bio',
                'conversation:id,name,is_group'
            ])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($m) {
                return [
                    'id' => $m->id,
                    'body' => $m->body,
                    'conversation_id' => $m->conversation_id,
                    'user_id' => $m->user_id,
                    'user_name' => $m->user->name,
                    'created_at' => $m->created_at,
                ];
            });

        return response()->json([
            'conversations' => $allConversations,
            'messages' => $messages,
        ]);
    }

    /**
     * Search messages within a specific conversation.
     * 
     * Eager Loading Strategy:
     * - User relationship eager loaded to prevent N+1 on message sender lookup
     * - Attachments eager loaded for complete message data
     * 
     * @param Request $request
     * @param Conversation $conversation
     * @return JsonResponse
     */
    public function searchChat(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();
        $query = $request->query('q', '');

        // Authorize: User must be part of this conversation
        abort_unless($conversation->users->contains($user->id), 403);

        if (strlen($query) < 1) {
            return response()->json([
                'messages' => [],
                'total' => 0,
            ]);
        }

        // Search messages in this conversation with eager loaded relationships
        // Uses indexed (conversation_id, created_at) for fast text search
        $messages = $conversation->messages()
            ->where('body', 'like', "%{$query}%")
            ->where('type', 'text')
            ->with([
                'user:id,name,avatar,phone,bio',
                'attachments:id,message_id,file_name,path,mime_type'
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'messages' => MessageResource::collection($messages),
            'total' => $messages->count(),
        ]);
    }

    /**
     * Get messages for infinite scroll (pagination backwards in time).
     * 
     * Optimized for large-scale data with:
     * - Reduced page size (20 messages per page)
     * - Query caching to minimize PostgreSQL load
     * - Efficient eager loading of relationships using column selection
     * - Composite indexes on (conversation_id, created_at) for fast time-based queries
     * 
     * @param Request $request
     * @param Conversation $conversation
     * @return JsonResponse
     */
    public function getMessages(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();
        
        // Authorize: User must be part of this conversation
        abort_unless($conversation->users->contains($user->id), 403);

        $page = $request->query('page', 1);
        $perPage = $request->query('per_page', 20); // Reduced from 30 to 20 for optimal load time
        $beforeId = $request->query('before_id', null);

        // Cache key for this query
        $cacheKey = "conversation.{$conversation->id}.messages.page.{$page}.per.{$perPage}" . ($beforeId ? ".before.{$beforeId}" : '');

        // Try to get from cache first (5 minute TTL)
        $messages = cache()->tags(["conversation.{$conversation->id}.messages"])->remember(
            $cacheKey,
            \DateInterval::createFromDateString('5 minutes'),
            function () use ($conversation, $page, $perPage, $beforeId) {
                $query = $conversation->messages()
                    ->with([
                        'user:id,name,avatar,phone,bio',
                        'attachments:id,message_id,file_name,path,mime_type,type,size'
                    ]);

                // If before_id provided, get messages before that ID (for infinite scroll)
                if ($beforeId) {
                    $beforeMessage = Message::find($beforeId);
                    if ($beforeMessage) {
                        $query->where('created_at', '<', $beforeMessage->created_at)
                            ->orWhere(function ($q) use ($beforeMessage) {
                                $q->where('created_at', '=', $beforeMessage->created_at)
                                    ->where('id', '<', $beforeMessage->id);
                            });
                    }
                }

                return $query->orderBy('created_at', 'desc')
                    ->orderBy('id', 'desc')
                    ->paginate($perPage, ['*'], 'page', $page);
            }
        );

        return response()->json([
            'messages' => MessageResource::collection(array_reverse($messages->items())),
            'pagination' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'total' => $messages->total(),
                'per_page' => $messages->perPage(),
                'has_more' => $messages->hasMorePages(),
            ],
        ]);
    }

    /**
     * Create a new group conversation.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function createGroup(Request $request): JsonResponse
    {
        $user = $request->user();

        // Validate input
        $validated = $request->validate([
            'name' => 'required|string|min:1|max:255',
            'user_ids' => 'required|array|min:2',
            'user_ids.*' => 'integer|exists:users,id|distinct',
            'description' => 'nullable|string|max:500',
            'avatar' => 'nullable|image|max:2048',
        ]);

        // Ensure current user is not trying to add themselves
        if (in_array($user->id, $validated['user_ids'])) {
            return response()->json([
                'message' => 'You cannot add yourself as a group member',
            ], 422);
        }

        // Check that at least 2 members (including current user)
        if (count($validated['user_ids']) < 2) {
            return response()->json([
                'message' => 'Group must have at least 2 other members',
            ], 422);
        }

        try {
            // Create the conversation
            $conversation = Conversation::create([
                'name' => $validated['name'],
                'is_group' => true,
                'created_by' => $user->id,
                'admin_id' => $user->id, // Creator is admin
                'description' => $validated['description'] ?? null,
            ]);

            // Handle avatar upload if provided
            if ($request->hasFile('avatar')) {
                $avatarPath = $request->file('avatar')->store('group-avatars', 'public');
                $conversation->update(['avatar' => $avatarPath]);
            }

            // Add current user as admin
            $conversation->users()->attach($user->id, [
                'role' => 'admin',
                'joined_at' => now(),
            ]);

            // Add selected users as members
            foreach ($validated['user_ids'] as $userId) {
                $conversation->users()->attach($userId, [
                    'role' => 'member',
                    'joined_at' => now(),
                ]);
            }

            // Load relationships for response
            $conversation->load(['users', 'lastMessage.user']);

            return response()->json(new ConversationResource($conversation), 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create group: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove a member from a group conversation.
     * Only group admin can remove members.
     * 
     * @param Request $request
     * @param Conversation $conversation
     * @param int $member User ID to remove
     * @return JsonResponse
     */
    public function removeMember(Request $request, Conversation $conversation, int $member): JsonResponse
    {
        $user = $request->user();

        // Authorize: User must be admin of this group
        abort_unless($conversation->is_group && $conversation->admin_id === $user->id, 403);

        // Cannot remove admin
        if ($conversation->admin_id === $member) {
            return response()->json([
                'message' => 'Cannot remove the group admin',
            ], 422);
        }

        // Remove the user
        $conversation->users()->detach($member);

        return response()->json([
            'message' => 'Member removed successfully',
        ]);
    }

    /**
     * Add members to a group conversation.
     * Only group admin can add members.
     * 
     * @param Request $request
     * @param Conversation $conversation
     * @return JsonResponse
     */
    public function addMembers(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();

        // Authorize: User must be admin of this group
        abort_unless($conversation->is_group && $conversation->admin_id === $user->id, 403);

        // Validate input
        $validated = $request->validate([
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'integer|exists:users,id|distinct',
        ]);

        // Get users that are already in the conversation
        $existingUserIds = $conversation->users()->pluck('user_id')->toArray();

        // Filter out users already in the group
        $newUserIds = array_diff($validated['user_ids'], $existingUserIds);

        if (empty($newUserIds)) {
            return response()->json([
                'message' => 'All users are already members of this group',
            ], 422);
        }

        // Add new members
        foreach ($newUserIds as $userId) {
            $conversation->users()->attach($userId, [
                'role' => 'member',
                'joined_at' => now(),
            ]);
        }

        // Load and return updated conversation
        $conversation->load(['users']);

        return response()->json(new ConversationResource($conversation), 200);
    }

    /**
     * Toggle star status on a message.
     * If message is not starred, star it. If already starred, unstar it.
     * 
     * @param Request $request
     * @param Message $message
     * @return JsonResponse
     */
    public function toggleStar(Request $request, Message $message): JsonResponse
    {
        $user = $request->user();

        // Authorize: User must have access to this message (part of conversation)
        abort_unless($message->conversation->users->contains($user->id), 403);

        // Check if already starred
        $isStarred = $message->starredBy()->where('user_id', $user->id)->exists();

        if ($isStarred) {
            // Unstar the message
            $message->starredBy()->detach($user->id);
            $starred = false;
        } else {
            // Star the message
            $message->starredBy()->attach($user->id);
            $starred = true;
        }

        return response()->json([
            'message' => $starred ? 'Message starred' : 'Message unstarred',
            'is_starred' => $starred,
        ]);
    }

    /**
     * Get all starred messages for the authenticated user.
     * Returns starred messages grouped by conversation with conversation details.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getStarredMessages(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = $request->query('per_page', 50);

        // Get starred messages with related data, paginated
        $starredMessages = $user->starredMessages()
            ->with(['user', 'conversation.users', 'attachments'])
            ->paginate($perPage);

        // Group by conversation for easier display
        $starredByConversation = collect($starredMessages->items())
            ->groupBy('conversation_id')
            ->map(function ($messages) {
                return [
                    'conversation' => $messages->first()->conversation,
                    'messages' => $messages->values(),
                ];
            })
            ->values();

        return response()->json([
            'data' => MessageResource::collection($starredMessages->items())->resolve(),
            'grouped_by_conversation' => $starredByConversation,
            'pagination' => [
                'current_page' => $starredMessages->currentPage(),
                'last_page' => $starredMessages->lastPage(),
                'total' => $starredMessages->total(),
                'per_page' => $starredMessages->perPage(),
            ],
        ]);
    }

    /**
     * Get starred messages for a specific conversation.
     * 
     * @param Request $request
     * @param Conversation $conversation
     * @return JsonResponse
     */
    public function getStarredMessagesInConversation(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();

        // Authorize: User must be part of this conversation
        abort_unless($conversation->users->contains($user->id), 403);

        // Get starred messages in this conversation
        $starredMessages = $user->starredMessages()
            ->where('conversation_id', $conversation->id)
            ->with(['user', 'attachments'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'messages' => MessageResource::collection($starredMessages),
            'total' => $starredMessages->count(),
        ]);
    }

    /**
     * Block a user.
     * Prevents the blocked user from sending messages to the blocker in conversations.
     *
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public function blockUser(Request $request, User $user): JsonResponse
    {
        $currentUser = $request->user();

        // Cannot block self
        if ($currentUser->id === $user->id) {
            return response()->json([
                'message' => 'You cannot block yourself',
            ], 422);
        }

        // Validate input
        $validated = $request->validate([
            'reason' => 'nullable|string|max:255',
        ]);

        // Block the user
        $currentUser->blockUser($user, $validated['reason'] ?? null);

        return response()->json([
            'message' => 'User blocked successfully',
            'blocked_user' => new UserResource($user),
        ], 200);
    }

    /**
     * Unblock a user.
     * Allows the unblocked user to send messages again.
     *
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public function unblockUser(Request $request, User $user): JsonResponse
    {
        $currentUser = $request->user();

        // Unblock the user
        $currentUser->unblockUser($user);

        return response()->json([
            'message' => 'User unblocked successfully',
            'unblocked_user' => new UserResource($user),
        ], 200);
    }

    /**
     * Get list of blocked users.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getBlockedUsers(Request $request): JsonResponse
    {
        $user = $request->user();

        $blockedUsers = $user->blockedUsers()
            ->select('users.id', 'users.name', 'users.email', 'users.avatar')
            ->get();

        return response()->json([
            'blocked_users' => UserResource::collection($blockedUsers),
            'total' => $blockedUsers->count(),
        ], 200);
    }

    /**
     * Check if user is blocked by the current user.
     *
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public function isUserBlocked(Request $request, User $user): JsonResponse
    {
        $currentUser = $request->user();

        $isBlocked = $currentUser->hasBlocked($user);

        return response()->json([
            'is_blocked' => $isBlocked,
            'user_id' => $user->id,
        ], 200);
    }
}

