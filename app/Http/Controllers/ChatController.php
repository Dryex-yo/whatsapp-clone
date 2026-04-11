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
}