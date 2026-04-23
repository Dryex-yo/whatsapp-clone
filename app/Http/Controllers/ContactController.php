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
     * Search users by phone number or email
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->query('q', '');

        if (strlen($query) < 3) {
            return response()->json(['results' => []]);
        }

        $currentUserId = Auth::id();

        // Search for users by email or phone
        $results = User::where('id', '!=', $currentUserId)
            ->where(function ($q) use ($query) {
                $q->where('email', 'like', '%' . $query . '%')
                  ->orWhere('phone', 'like', '%' . $query . '%')
                  ->orWhere('name', 'like', '%' . $query . '%');
            })
            ->select('id', 'name', 'email', 'phone', 'avatar')
            ->limit(20)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'avatar' => $user->avatar,
                ];
            });

        return response()->json(['results' => $results]);
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
