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

        // Validate input
        $validated = $request->validate([
            'body' => 'required|string|max:5000',
            'file' => 'nullable|file|max:52428800', // 50MB max
        ]);

        // Determine message type
        $type = 'text';
        $filePath = null;
        $fileSize = null;
        $mimeType = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $type = str_starts_with($file->getMimeType(), 'image/') ? 'image' : 'file';
            
            // Store file
            $filePath = $file->store('messages', 'public');
            $fileSize = $file->getSize();
            $mimeType = $file->getMimeType();
        }

        // Create message
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
            'body' => $validated['body'],
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
}
