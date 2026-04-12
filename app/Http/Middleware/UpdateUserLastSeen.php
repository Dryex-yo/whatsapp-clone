<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * UpdateUserLastSeen Middleware
 * 
 * Updates the user's last_seen timestamp on every authenticated interaction
 * Helps track when users were last active in the application
 */
class UpdateUserLastSeen
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()) {
            $request->user()->update([
                'last_seen' => now(),
            ]);
        }

        return $next($request);
    }
}
