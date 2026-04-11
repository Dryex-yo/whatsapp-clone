<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function index(Request $request): Response
    {
        // Mengambil percakapan user beserta pesan terakhir dan user lainnya
        $conversations = $request->user()->conversations()
            ->with(['lastMessage', 'users'])
            ->get();

        return Inertia::render('Chat', [
            'conversations' => $conversations
        ]);
    }

    public function show(Request $request, Conversation $conversation)
    {
        // Pastikan user adalah bagian dari percakapan ini
        abort_unless($conversation->users->contains($request->user()->id), 403);

        return Inertia::render('Chat', [
            'conversations' => $request->user()->conversations()->with(['lastMessage', 'users'])->get(),
            'activeConversation' => $conversation->load(['messages.user', 'users']),
        ]);
    }
}