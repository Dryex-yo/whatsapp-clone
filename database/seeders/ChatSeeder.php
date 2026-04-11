<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ChatSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Buat User dummy (Termasuk akun kamu untuk login)
        $dery = User::factory()->create([
            'name' => 'Dery Supriyadi',
            'email' => 'dery@example.com',
            'password' => Hash::make('password'),
        ]);

        $john = User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
        ]);

        $jane = User::factory()->create([
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
        ]);

        // 2. Buat Percakapan Personal (Dery & John)
        $chat1 = Conversation::create(['is_group' => false]);
        $chat1->users()->attach([$dery->id, $john->id]);

        // Tambahkan beberapa pesan di chat 1
        Message::create([
            'conversation_id' => $chat1->id,
            'user_id' => $john->id,
            'body' => 'Halo Dery, apa kabar project WhatsApp Clone-nya?',
        ]);

        Message::create([
            'conversation_id' => $chat1->id,
            'user_id' => $dery->id,
            'body' => 'Alhamdulillah lancar John, ini lagi setup database pakai Postgres.',
        ]);

        // 3. Buat Percakapan Personal (Dery & Jane)
        $chat2 = Conversation::create(['is_group' => false]);
        $chat2->users()->attach([$dery->id, $jane->id]);

        Message::create([
            'conversation_id' => $chat2->id,
            'user_id' => $jane->id,
            'body' => 'Dery, jangan lupa nanti malam ada meeting ya.',
        ]);

        // 4. Update timestamp conversation agar urutannya benar di sidebar
        $chat1->touch();
        $chat2->touch();
    }
}