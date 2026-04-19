<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

/**
 * AIService - Handles AI-powered responses using OpenAI or Google Gemini
 * 
 * Supports:
 * - Message history context (last 5 messages)
 * - Multiple AI providers (OpenAI, Gemini)
 * - Error handling and logging
 * - Configurable timeouts
 */
class AIService
{
    /**
     * Generate an AI response based on conversation context
     * 
     * Fetches last 5 messages as context and sends to configured AI provider
     * 
     * @param Conversation $conversation
     * @param string $userMessage The current user message
     * @param User $currentUser The user who sent the message
     * @return string The AI-generated response
     * @throws Exception If API call fails
     */
    public function generateResponse(Conversation $conversation, string $userMessage, User $currentUser): string
    {
        $provider = config('services.ai.provider', 'openai');
        
        // Fetch context - last 5 messages from conversation
        $contextMessages = $this->getConversationContext($conversation);
        
        // Build message history
        $messageHistory = $this->buildMessageHistory($contextMessages, $userMessage);
        
        // Call appropriate provider
        if ($provider === 'gemini') {
            return $this->callGeminiAPI($messageHistory, $userMessage);
        } else {
            return $this->callOpenAIAPI($messageHistory);
        }
    }

    /**
     * Get the last 5 messages from the conversation for context
     * 
     * @param Conversation $conversation
     * @return array Collection of Message objects
     */
    private function getConversationContext(Conversation $conversation): array
    {
        return $conversation->messages()
            ->with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->reverse()
            ->toArray();
    }

    /**
     * Build message history for the AI model
     * 
     * Converts database messages to the format expected by AI APIs
     * 
     * @param array $contextMessages
     * @param string $currentUserMessage
     * @return array Formatted message history
     */
    private function buildMessageHistory(array $contextMessages, string $currentUserMessage): array
    {
        $messages = [];
        
        // Add system prompt
        $messages[] = [
            'role' => 'system',
            'content' => 'Kamu adalah Meta AI, asisten virtual yang membantu pengguna. '
                . 'Respons dalam bahasa Indonesia dengan cara yang ramah dan profesional. '
                . 'Jawab singkat dan jelas. Jangan lebih dari 2-3 kalimat untuk chat normal. '
                . 'Jika ditanya informasi yang tidak kamu tahu, katakan dengan jujur.',
        ];
        
        // Add context messages
        foreach ($contextMessages as $msg) {
            // Skip system messages or empty bodies
            if (empty($msg['body'])) {
                continue;
            }
            
            // Determine if message is from AI or user based on email
            $isFromAI = isset($msg['user']) && $msg['user']['email'] === 'ai@whatsapp-clone.local';
            
            $messages[] = [
                'role' => $isFromAI ? 'assistant' : 'user',
                'content' => $msg['body'],
            ];
        }
        
        // Add current user message
        $messages[] = [
            'role' => 'user',
            'content' => $currentUserMessage,
        ];
        
        return $messages;
    }

    /**
     * Call OpenAI API (GPT-3.5 or GPT-4)
     * 
     * @param array $messageHistory Formatted message history
     * @return string The AI response
     * @throws Exception If API call fails
     */
    private function callOpenAIAPI(array $messageHistory): string
    {
        $apiKey = config('services.ai.openai.api_key');
        $model = config('services.ai.openai.model', 'gpt-3.5-turbo');
        $timeout = config('services.ai.openai.timeout', 30);
        
        if (!$apiKey) {
            throw new Exception('OpenAI API key is not configured. Set OPENAI_API_KEY in .env');
        }
        
        try {
            $response = Http::timeout($timeout)
                ->withHeaders([
                    'Authorization' => "Bearer {$apiKey}",
                    'Content-Type' => 'application/json',
                ])
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => $model,
                    'messages' => $messageHistory,
                    'temperature' => 0.7,
                    'max_tokens' => 500,
                ])
                ->throw()
                ->json();
            
            // Extract response content
            if (isset($response['choices'][0]['message']['content'])) {
                return trim($response['choices'][0]['message']['content']);
            }
            
            throw new Exception('Invalid response format from OpenAI');
        } catch (Exception $e) {
            Log::error('OpenAI API Error: ' . $e->getMessage());
            throw new Exception('Failed to generate AI response: ' . $e->getMessage());
        }
    }

    /**
     * Call Google Gemini API
     * 
     * @param array $messageHistory Formatted message history
     * @param string $currentMessage The current user message
     * @return string The AI response
     * @throws Exception If API call fails
     */
    private function callGeminiAPI(array $messageHistory, string $currentMessage): string
    {
        $apiKey = config('services.ai.gemini.api_key');
        $model = config('services.ai.gemini.model', 'gemini-1.5-flash');
        
        if (!$apiKey) {
            throw new Exception('Gemini API key is not configured. Set GEMINI_API_KEY in .env');
        }
        
        try {
            // Gemini API uses a different format - convert messages to content parts
            $contents = [];
            
            foreach ($messageHistory as $message) {
                if ($message['role'] === 'system') {
                    // Add system instruction as first message
                    $contents[] = [
                        'role' => 'user',
                        'parts' => [
                            ['text' => $message['content']]
                        ],
                    ];
                } else {
                    $contents[] = [
                        'role' => $message['role'] === 'assistant' ? 'model' : 'user',
                        'parts' => [
                            ['text' => $message['content']]
                        ],
                    ];
                }
            }
            
            $response = Http::timeout(30)
                ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent", [
                    'contents' => $contents,
                    'generationConfig' => [
                        'temperature' => 0.7,
                        'maxOutputTokens' => 500,
                    ],
                ], [
                    'key' => $apiKey,
                ])
                ->throw()
                ->json();
            
            // Extract response content
            if (isset($response['candidates'][0]['content']['parts'][0]['text'])) {
                return trim($response['candidates'][0]['content']['parts'][0]['text']);
            }
            
            throw new Exception('Invalid response format from Gemini');
        } catch (Exception $e) {
            Log::error('Gemini API Error: ' . $e->getMessage());
            throw new Exception('Failed to generate AI response: ' . $e->getMessage());
        }
    }
}
