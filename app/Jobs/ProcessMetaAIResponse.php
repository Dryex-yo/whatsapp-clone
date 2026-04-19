<?php

namespace App\Jobs;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Services\AIService;
use App\Events\MessageSent;
use App\Http\Resources\MessageResource;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Exception;

/**
 * ProcessMetaAIResponse Job - Handles asynchronous AI response generation
 * 
 * Queued job that:
 * - Calls the AI service with conversation context
 * - Saves the AI response to the database
 * - Broadcasts the response via Reverb
 * - Handles errors gracefully
 */
class ProcessMetaAIResponse implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout = 60;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public int $backoff = 5;

    /**
     * The maximum number of exceptions to allow before giving up.
     */
    public int $maxExceptions = 3;

    /**
     * Create a new job instance.
     */
    public function __construct(
        private Conversation $conversation,
        private Message $userMessage,
        private string $userMessageBody,
        private User $currentUser,
    ) {}

    /**
     * Execute the job.
     */
    public function handle(AIService $aiService): void
    {
        try {
            // Get AI response with conversation context
            $aiResponse = $aiService->generateResponse(
                $this->conversation,
                $this->userMessageBody,
                $this->currentUser
            );

            // Create AI response message
            $aiUser = User::where('email', 'ai@whatsapp-clone.local')->first();
            
            if (!$aiUser) {
                Log::error('Meta AI user not found');
                return;
            }

            $aiMessage = Message::create([
                'conversation_id' => $this->conversation->id,
                'user_id' => $aiUser->id,
                'body' => $aiResponse,
                'type' => 'text',
                'status' => 'sent',
                'is_encrypted' => false,
                'is_ephemeral' => false,
            ]);

            // Load relationships for broadcast
            $aiMessage->load(['user', 'attachments']);

            // Broadcast AI response immediately via Reverb
            MessageSent::dispatch($aiMessage);

            Log::info('Meta AI response generated and broadcast successfully', [
                'conversation_id' => $this->conversation->id,
                'message_id' => $aiMessage->id,
            ]);
        } catch (Exception $e) {
            Log::error('Error processing Meta AI response: ' . $e->getMessage(), [
                'conversation_id' => $this->conversation->id,
                'user_message_id' => $this->userMessage->id,
                'error' => $e,
            ]);
            
            // Re-throw to allow retry mechanism to work
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(Exception $exception): void
    {
        Log::error('Meta AI job failed after max retries: ' . $exception->getMessage(), [
            'conversation_id' => $this->conversation->id,
            'exception' => $exception,
        ]);
    }
}
