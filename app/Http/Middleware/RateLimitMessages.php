<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

/**
 * RateLimitMessages Middleware
 * 
 * Enforces rate limiting on message sending to prevent spam and abuse.
 * Configuration: 60 messages per minute per user (per conversation)
 * 
 * Rate limit key format:
 * - Global: "message-send:{user_id}" (60 per minute across all conversations)
 * - Per-conversation: "message-send:{user_id}:{conversation_id}" (for stricter per-chat limits if needed)
 */
class RateLimitMessages
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only apply to POST requests to message endpoints
        if ($request->isMethod('post') && $request->routeIs('messages.store')) {
            $user = $request->user();

            if ($user) {
                // Use global rate limit key (per user, not per conversation)
                // This prevents users from spamming across multiple conversations
                $key = "message-send:{$user->id}";
                $maxAttempts = 60; // 60 messages per minute
                $decayMinutes = 1;

                if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
                    $seconds = RateLimiter::availableIn($key);
                    $message = "You are sending messages too quickly. Please wait {$seconds} seconds before sending another message.";

                    return response()->json([
                        'message' => $message,
                        'retry_after' => $seconds,
                    ], 429); // 429 Too Many Requests
                }

                RateLimiter::hit($key, $decayMinutes * 60);
            }
        }

        return $next($request);
    }
}
