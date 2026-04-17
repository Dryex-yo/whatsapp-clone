<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HandleSocketIOCors
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get the origin from the request
        $origin = $request->header('Origin');
        
        // List of allowed origins
        $allowedOrigins = [
            env('APP_URL'),
            'http://localhost',
            'http://localhost:3000',
            'http://localhost:5173',
            'http://whatsapp-clone.test',
            'http://' . parse_url(env('APP_URL'), PHP_URL_HOST),
        ];

        // Set CORS headers if origin is allowed
        if (in_array($origin, $allowedOrigins)) {
            $response = $next($request);
            $response->header('Access-Control-Allow-Origin', $origin);
            $response->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
            $response->header('Access-Control-Allow-Credentials', 'true');
            $response->header('Access-Control-Max-Age', '86400');

            return $response;
        }

        return $next($request);
    }
}
