<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    // Fitur 1: Cari User berdasarkan Email
    public function search(Request $request)
    {
        $query = $request->query('q');

        $users = User::where('email', $query)
                    ->where('id', '!=', auth()->id())
                    // Include profile fields for display
                    ->get(['id', 'name', 'email', 'avatar', 'profile_photo_path', 'phone', 'bio']); 

        return response()->json($users);
    }

    // Fitur 2: Cari Pengguna di Sekitar (Radius 5KM)
    public function nearby(Request $request)
    {
        $lat = $request->lat;
        $lng = $request->lng;

        if (!$lat || !$lng) {
            return response()->json(['message' => 'Lokasi tidak ditemukan'], 400);
        }

        // Rumus Haversine untuk mencari jarak berdasarkan koordinat
        $users = User::select('id', 'name', 'email', 'profile_photo_path', 'avatar', 'phone', 'bio', 'latitude', 'longitude')
            ->selectRaw("( 6371 * acos( cos( radians(?) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(?) ) + sin( radians(?) ) * sin( radians( latitude ) ) ) ) AS distance", [$lat, $lng, $lat])
            ->where('id', '!=', auth()->id())
            ->having('distance', '<', 5) // Radius 5 KM
            ->orderBy('distance')
            ->get();

        return response()->json($users);
    }
}