<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Http\Resources\MessageResource;
use App\Events\MessageSent;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * MetaAIController - Handles interactions with Meta AI system user
 * 
 * Processes messages to Meta AI, generates mock responses, and broadcasts
 * them in real-time via Laravel Reverb WebSockets.
 */
class MetaAIController extends Controller
{
    use AuthorizesRequests;

    /**
     * The Meta AI system user email identifier
     */
    const META_AI_EMAIL = 'ai@whatsapp-clone.local';

    /**
     * Handle a message sent to Meta AI.
     * 
     * - Saves user's message to messages table
     * - Generates a mock AI response
     * - Saves AI response to messages table
     * - Broadcasts both messages in real-time via Reverb
     * 
     * @param Request $request
     * @param Conversation $conversation
     * @return JsonResponse
     */
    public function store(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();

        // Verify user is part of this conversation
        abort_unless($conversation->users->contains($user->id), 403);

        // Verify the conversation includes Meta AI user
        $aiUser = User::where('email', self::META_AI_EMAIL)->first();
        abort_unless($aiUser && $conversation->users->contains($aiUser->id), 404);

        // Validate input
        $validated = $request->validate([
            'body' => 'required|string|max:5000',
        ]);

        // Save user's message to the database
        $userMessage = Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
            'body' => $validated['body'],
            'type' => 'text',
            'status' => 'sent',
            'is_encrypted' => false,
            'is_ephemeral' => false,
        ]);

        // Load user relationship for broadcast
        $userMessage->load(['user', 'attachments']);

        // Broadcast user's message immediately
        MessageSent::dispatch($userMessage);

        // Generate mock AI response
        $mockResponse = 'Halo! Saya Meta AI, asisten virtualmu. Fitur ini sedang dalam pengembangan.';

        // Create AI response message
        $aiMessage = Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => $aiUser->id,
            'body' => $mockResponse,
            'type' => 'text',
            'status' => 'sent',
            'is_encrypted' => false,
            'is_ephemeral' => false,
        ]);

        // Load AI message relationships for broadcast
        $aiMessage->load(['user', 'attachments']);

        // Broadcast AI response immediately
        MessageSent::dispatch($aiMessage);

        // Update conversation's updated_at timestamp
        $conversation->touch();

        // Update pivot's updated_at for proper sorting in conversation list
        $conversation->users()->updateExistingPivot($user->id, [
            'updated_at' => now(),
        ]);

        // Invalidate message pagination cache for this conversation
        cache()->tags(["conversation.{$conversation->id}.messages"])->flush();

        // Return both messages to the client
        return response()->json([
            'userMessage' => new MessageResource($userMessage),
            'aiMessage' => new MessageResource($aiMessage),
        ], 201);
    }
}
