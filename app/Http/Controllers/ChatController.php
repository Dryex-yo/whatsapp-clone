<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use App\Http\Resources\UserResource;
use App\Events\MessageSent;
use App\Events\ConversationOpened;
use App\Events\UpdateUserPresence;
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
    /**
     * Display a listing of all conversations for the authenticated user.
     * 
     * @param Request $request
     * @return Response
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Fetch conversations with last message and participants
        // Sorted by pinned (pinned first), then by most recent activity
        $conversations = $user->conversations()
            ->with([
                'lastMessage.user',
                'users',
            ])
            ->withCount(['messages as unreadMessages' => function ($query) use ($user) {
                // Count messages that haven't been read by this user
                $query->where('user_id', '!=', $user->id)
                    ->whereNull('read_at');
            }])
            ->orderBy('pivot_is_pinned', 'desc')
            ->orderBy('pivot_updated_at', 'desc')
            ->get();

        return Inertia::render('Chat/Index', [
            'currentUser' => new UserResource($user),
            'conversations' => ConversationResource::collection($conversations)->resolve(),
        ]);
    }

    /**
     * Display a specific conversation with paginated messages.
     * 
     * @param Request $request
     * @param Conversation $conversation
     * @return Response
     */
    public function show(Request $request, Conversation $conversation): Response
    {
        $user = $request->user();

        // Authorize: User must be part of this conversation
        abort_unless($conversation->users->contains($user->id), 403);

        // Dispatch ConversationOpened event to mark received messages as delivered
        ConversationOpened::dispatch($conversation, $user);

        // Fetch paginated messages (50 per page, arrange newest last)
        $messages = $conversation->messages()
            ->with(['user', 'attachments'])
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        // Reverse to show oldest first on frontend
        $messagesCollection = $messages->items();
        array_walk($messagesCollection, function (&$item) {
            // Items are already in the right order from collection
        });

        // Fetch all conversations for sidebar
        $conversations = $user->conversations()
            ->with(['lastMessage.user', 'users'])
            ->withCount(['messages as unreadMessages' => function ($query) use ($user) {
                $query->where('user_id', '!=', $user->id)
                    ->whereNull('read_at');
            }])
            ->orderBy('pivot_is_pinned', 'desc')
            ->orderBy('pivot_updated_at', 'desc')
            ->get();

        return Inertia::render('Chat/Show', [
            'currentUser' => new UserResource($user),
            'conversations' => ConversationResource::collection($conversations)->resolve(),
            'activeConversation' => new ConversationResource($conversation->load(['users'])),
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
     * @param Request $request
     * @param Conversation $conversation
     * @return JsonResponse
     */
    public function store(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();

        // Authorize: User must be part of this conversation
        abort_unless($conversation->users->contains($user->id), 403);

        // Validate input - body can be empty if file is provided (for voice/media-only messages)
        $validated = $request->validate([
            'body' => 'nullable|string|max:5000',
            'file' => 'nullable|file|max:52428800', // 50MB max
        ]);

        // At least body OR file must be provided
        if (empty($validated['body']) && !$request->hasFile('file')) {
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

        // Create message
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
            'body' => $validated['body'] ?? '',
            'type' => $type,
            'status' => 'sent', // Default status for new messages
            'file_path' => $filePath,
            'file_size' => $fileSize,
            'mime_type' => $mimeType,
        ]);

        // Load user relationship for response
        $message->load(['user', 'attachments']);

        // Update conversation's updated_at timestamp
        $conversation->touch();

        // Update the pivot's updated_at for proper sorting
        $conversation->users()->updateExistingPivot($user->id, [
            'updated_at' => now(),
        ]);

        // Broadcast message to all conversation members in real-time via Reverb
        MessageSent::dispatch($message);

        return response()->json(new MessageResource($message), 201);
    }

    /**
     * Update user presence in a conversation.
     * 
     * Broadcasts to presence channel to notify other users that this user is online
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

        // Update last_seen (middleware should handle this, but explicit update for presence)
        $user->update(['last_seen' => now()]);

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

        // Search conversations by name and users
        $conversationIds = $user->conversations()
            ->pluck('conversation_id')
            ->toArray();

        // Search by conversation name
        $conversationsByName = Conversation::where('is_group', true)
            ->whereIn('id', $conversationIds)
            ->where('name', 'like', "%{$query}%")
            ->with(['lastMessage.user', 'users'])
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
        $conversationsByUser = Conversation::where('is_group', false)
            ->whereIn('id', $conversationIds)
            ->with('users')
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
                    'last_message' => $c->lastMessage,
                ];
            });

        // Merge and deduplicate conversations
        $allConversations = collect($conversationsByName)
            ->merge($conversationsByUser)
            ->unique('id')
            ->values()
            ->take(10);

        // Search in messages
        $messages = Message::whereIn('conversation_id', $conversationIds)
            ->where('body', 'like', "%{$query}%")
            ->where('type', 'text')
            ->with(['user', 'conversation.users'])
            ->orderBy('created_at', 'desc')
            ->take(20)
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

        // Search messages in this conversation
        $messages = $conversation->messages()
            ->where('body', 'like', "%{$query}%")
            ->where('type', 'text')
            ->with(['user', 'attachments'])
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
        $perPage = $request->query('per_page', 30);
        $beforeId = $request->query('before_id', null);

        $query = $conversation->messages()
            ->with(['user', 'attachments']);

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

        $messages = $query->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

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
}

