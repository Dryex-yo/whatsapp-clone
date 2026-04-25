<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class NearbyUserController extends Controller
{
    /**
     * Get nearby users within 5km radius using Haversine formula
     * 
     * Haversine formula calculates the great-circle distance between two points 
     * on a sphere given their longitudes and latitudes.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getNearby(Request $request): JsonResponse
    {
        // Validate input parameters
        $validated = $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lng' => 'required|numeric|between:-180,180',
            'radius' => 'numeric|min:0.1|max:100',
        ]);

        $currentUserId = Auth::id();
        $userLat = $validated['lat'];
        $userLng = $validated['lng'];
        $radiusKm = $validated['radius'] ?? 5; // Default 5km

        try {
            // Query nearby users using Haversine formula
            $nearbyUsers = User::where('id', '!=', $currentUserId)
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->selectRaw(
                    '*, 
                    (6371 * acos(
                        cos(radians(?)) * 
                        cos(radians(latitude)) * 
                        cos(radians(longitude) - radians(?)) + 
                        sin(radians(?)) * 
                        sin(radians(latitude))
                    )) AS distance',
                    [$userLat, $userLng, $userLat]
                )
                ->havingRaw('distance <= ?', [$radiusKm])
                ->orderBy('distance', 'asc')
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'avatar' => $user->avatar,
                        'bio' => $user->bio,
                        'latitude' => $user->latitude,
                        'longitude' => $user->longitude,
                        'distance' => round($user->distance, 2), // Distance in km
                        'last_seen' => $user->last_seen,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $nearbyUsers,
                'count' => $nearbyUsers->count(),
                'user_location' => [
                    'latitude' => $userLat,
                    'longitude' => $userLng,
                ],
                'radius' => $radiusKm,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch nearby users',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update the authenticated user's geolocation coordinates
     * 
     * Called when user enables location sharing to update their position
     * in the database for nearby user discovery.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function updateLocation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        try {
            $request->user()->update([
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
                'location_updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Location updated successfully',
                'latitude' => $request->user()->latitude,
                'longitude' => $request->user()->longitude,
                'location_updated_at' => $request->user()->location_updated_at,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update location',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}

