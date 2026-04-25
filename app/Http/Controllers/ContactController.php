<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    /**
     * Show the Add Contact page
     */
    public function add(): Response
    {
        return Inertia::render('Contacts/Add');
    }

    /**
     * Show the new Add Contact page with manual search and nearby users
     */
    public function addNew(): Response
    {
        return Inertia::render('Contacts/AddContact');
    }

    /**
     * Search users by phone number or email
     * 
     * Uses case-insensitive search for email to prevent "not found" errors
     * when users register with capital letters.
     * Returns all necessary fields for frontend display (name, email, avatar).
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function search(Request $request): JsonResponse
    {
        $query = trim($request->query('q', ''));

        if (strlen($query) < 3) {
            return response()->json(['results' => []]);
        }

        $currentUserId = Auth::id();
        $lowerQuery = strtolower($query);

        // Search for users by email (case-insensitive), phone, or name
        $results = User::where('id', '!=', $currentUserId)
            ->where(function ($q) use ($query, $lowerQuery) {
                // Case-insensitive email search using LOWER()
                $q->whereRaw('LOWER(email) LIKE ?', ['%' . $lowerQuery . '%'])
                  ->orWhere('phone', 'like', '%' . $query . '%')
                  ->orWhere('name', 'like', '%' . $query . '%');
            })
            ->select('id', 'name', 'email', 'phone', 'avatar', 'bio')
            ->limit(20)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name ?? 'Unknown User',
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'avatar' => $user->avatar,
                    'bio' => $user->bio,
                ];
            });

        return response()->json(['results' => $results]);
    }

    /**
     * Find a user by exact email address
     * 
     * Used for direct user lookup (e.g., starting a chat by email)
     * Ensures exact match after trimming and lowercasing
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function findByEmail(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $currentUserId = Auth::id();
        $email = trim(strtolower($request->input('email')));

        $user = User::where('id', '!=', $currentUserId)
            ->whereRaw('LOWER(email) = ?', [$email])
            ->select('id', 'name', 'email', 'phone', 'avatar', 'bio', 'last_seen')
            ->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name ?? 'Unknown User',
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'bio' => $user->bio,
                'last_seen' => $user->last_seen,
            ],
        ], 200);
    }

    /**
     * Add contacts (creates conversations with selected users)
     */
    public function storeContacts(Request $request): JsonResponse
    {
        $request->validate([
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'required|integer|exists:users,id',
        ]);

        $currentUserId = Auth::id();
        $userIds = $request->input('user_ids');

        // Filter out current user if accidentally included
        $userIds = array_filter($userIds, function ($id) use ($currentUserId) {
            return $id !== $currentUserId;
        });

        if (empty($userIds)) {
            return response()->json(['error' => 'No valid users to add'], 422);
        }

        $createdConversations = [];

        // Create conversations with selected users
        foreach ($userIds as $userId) {
            // Check if conversation already exists
            $existingConversation = \App\Models\Conversation::whereHas('users', function ($q) use ($currentUserId) {
                $q->where('user_id', $currentUserId);
            })
            ->whereHas('users', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            })
            ->where('is_group', false)
            ->first();

            if (!$existingConversation) {
                // Create new conversation
                $conversation = \App\Models\Conversation::create([
                    'is_group' => false,
                ]);

                // Attach users to conversation
                $conversation->users()->attach([
                    $currentUserId => ['joined_at' => now()],
                    $userId => ['joined_at' => now()],
                ]);

                $createdConversations[] = $conversation->id;
            }
        }

        return response()->json([
            'message' => 'Contacts added successfully',
            'created_conversations' => $createdConversations,
        ]);
    }
}
