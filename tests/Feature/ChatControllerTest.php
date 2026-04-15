<?php

use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

describe('Chat Models & Authorization', function () {
    
    describe('User Model', function () {
        
        it('can block another user', function () {
            $user1 = User::factory()->create();
            $user2 = User::factory()->create();
            
            $user1->blockUser($user2);
            
            expect($user1->hasBlocked($user2))->toBeTrue();
            expect($user1->hasBlocked($user2->id))->toBeTrue();
        });
        
        it('blocked user is shown in blocked users list', function () {
            $user1 = User::factory()->create();
            $user2 = User::factory()->create();
            $user3 = User::factory()->create();
            
            $user1->blockUser($user2);
            $user1->blockUser($user3);
            
            expect($user1->blockedUsers()->count())->toBe(2);
        });
        
        it('can unblock a user', function () {
            $user1 = User::factory()->create();
            $user2 = User::factory()->create();
            
            $user1->blockUser($user2);
            expect($user1->hasBlocked($user2))->toBeTrue();
            
            $user1->unblockUser($user2);
            expect($user1->hasBlocked($user2))->toBeFalse();
        });
        
        it('maintains many conversations', function () {
            $user = User::factory()->create();
            $convs = Conversation::factory(5)->create(['created_by' => $user->id, 'admin_id' => $user->id]);
            
            $convs->each(fn ($conv) => $conv->users()->attach($user->id));
            
            expect($user->conversations()->count())->toBe(5);
        });
    });
    
    describe('Conversation Model', function () {
        
        it('belongs to many users', function () {
            $user1 = User::factory()->create();
            $user2 = User::factory()->create();
            $conv = Conversation::factory()->create(['created_by' => $user1->id, 'admin_id' => $user1->id]);
            
            $conv->users()->attach([$user1->id, $user2->id]);
            
            expect($conv->users()->count())->toBe(2);
            expect($conv->users->contains($user1))->toBeTrue();
            expect($conv->users->contains($user2))->toBeTrue();
        });
        
        it('has many messages', function () {
            $user = User::factory()->create();
            $conv = Conversation::factory()->create(['created_by' => $user->id, 'admin_id' => $user->id]);
            
            Message::factory(10)->create(['conversation_id' => $conv->id, 'user_id' => $user->id]);
            
            expect($conv->messages()->count())->toBe(10);
        });
        
        it('has single last message relation', function () {
            $user = User::factory()->create();
            $conv = Conversation::factory()->create(['created_by' => $user->id, 'admin_id' => $user->id]);
            
            $msg1 = Message::factory()->create(['conversation_id' => $conv->id, 'user_id' => $user->id]);
            $msg2 = Message::factory()->create(['conversation_id' => $conv->id, 'user_id' => $user->id]);
            
            $last = $conv->lastMessage;
            expect($last->id)->toBe($msg2->id);
        });
        
        it('can be group or direct', function () {
            $user = User::factory()->create();
            $group = Conversation::factory()->group()->create(['created_by' => $user->id, 'admin_id' => $user->id]);
            $direct = Conversation::factory()->direct()->create(['created_by' => $user->id, 'admin_id' => $user->id]);
            
            expect($group->is_group)->toBeTrue();
            expect($direct->is_group)->toBeFalse();
        });
    });
    
    describe('Message Model', function () {
        
        it('belongs to user and conversation', function () {
            $user = User::factory()->create();
            $conv = Conversation::factory()->create(['created_by' => $user->id, 'admin_id' => $user->id]);
            
            $msg = Message::factory()->create([
                'conversation_id' => $conv->id,
                'user_id' => $user->id,
            ]);
            
            expect($msg->user->id)->toBe($user->id);
            expect($msg->conversation->id)->toBe($conv->id);
        });
        
        it('has many attachments', function () {
            $user = User::factory()->create();
            $conv = Conversation::factory()->create(['created_by' => $user->id, 'admin_id' => $user->id]);
            
            $msg = Message::factory()->create([
                'conversation_id' => $conv->id,
                'user_id' => $user->id,
            ]);
            
            MessageAttachment::factory(3)->create(['message_id' => $msg->id, 'user_id' => $user->id]);
            
            expect($msg->attachments()->count())->toBe(3);
        });
        
        it('can be encrypted or plain', function () {
            $user = User::factory()->create();
            $conv = Conversation::factory()->create(['created_by' => $user->id, 'admin_id' => $user->id]);
            
            $encrypted = Message::factory()->create([
                'conversation_id' => $conv->id,
                'user_id' => $user->id,
                'is_encrypted' => true,
                'encrypted_body' => 'ciphertext',
            ]);
            
            $plain = Message::factory()->create([
                'conversation_id' => $conv->id,
                'user_id' => $user->id,
                'is_encrypted' => false,
                'body' => 'plain text',
            ]);
            
            expect($encrypted->is_encrypted)->toBeTrue();
            expect($plain->is_encrypted)->toBeFalse();
        });
        
        it('can be ephemeral', function () {
            $user = User::factory()->create();
            $conv = Conversation::factory()->create(['created_by' => $user->id, 'admin_id' => $user->id]);
            
            $ephemeral = Message::factory()->ephemeral()->create([
                'conversation_id' => $conv->id,
                'user_id' => $user->id,
            ]);
            
            expect($ephemeral->is_ephemeral)->toBeTrue();
        });
        
        it('tracks read status', function () {
            $user = User::factory()->create();
            $conv = Conversation::factory()->create(['created_by' => $user->id, 'admin_id' => $user->id]);
            
            $unread = Message::factory()->create([
                'conversation_id' => $conv->id,
                'user_id' => $user->id,
                'read_at' => null,
            ]);
            
            $read = Message::factory()->read()->create([
                'conversation_id' => $conv->id,
                'user_id' => $user->id,
            ]);
            
            expect($unread->read_at)->toBeNull();
            expect($read->read_at)->not->toBeNull();
        });
    });
    
    describe('MessageAttachment Model', function () {
        
        it('belongs to message and user', function () {
            $user = User::factory()->create();
            $conv = Conversation::factory()->create(['created_by' => $user->id, 'admin_id' => $user->id]);
            
            $msg = Message::factory()->create([
                'conversation_id' => $conv->id,
                'user_id' => $user->id,
            ]);
            
            $attachment = MessageAttachment::factory()->create([
                'message_id' => $msg->id,
                'user_id' => $user->id,
            ]);
            
            expect($attachment->message->id)->toBe($msg->id);
            expect($attachment->user->id)->toBe($user->id);
        });
        
        it('can be image, audio, video, or document', function () {
            $user = User::factory()->create();
            $conv = Conversation::factory()->create(['created_by' => $user->id, 'admin_id' => $user->id]);
            
            $msg = Message::factory()->create([
                'conversation_id' => $conv->id,
                'user_id' => $user->id,
            ]);
            
            $image = MessageAttachment::factory()->image()->create(['message_id' => $msg->id]);
            $audio = MessageAttachment::factory()->audio()->create(['message_id' => $msg->id]);
            $video = MessageAttachment::factory()->video()->create(['message_id' => $msg->id]);
            $doc = MessageAttachment::factory()->document()->create(['message_id' => $msg->id]);
            
            expect($image->type)->toBe('image');
            expect($audio->type)->toBe('audio');
            expect($video->type)->toBe('video');
            expect($doc->type)->toBe('document');
        });
    });
});

describe('Query Optimization', function () {
    
    it('factory creates models efficiently without N+1', function () {
        DB::enableQueryLog();
        
        $users = User::factory(5)->create();
        
        $queryCount = count(DB::getQueryLog());
        DB::disableQueryLog();
        
        // Creating 5 users should be around 5 queries, not 25+
        expect($queryCount)->toBeLessThan(15);
    });
    
    it('conversation factory with users is efficient', function () {
        DB::enableQueryLog();
        
        $user = User::factory()->create();
        $convs = Conversation::factory(3)->create([
            'created_by' => $user->id,
            'admin_id' => $user->id,
        ]);
        
        $convs->each(fn ($c) => $c->users()->attach($user->id));
        
        $queryCount = count(DB::getQueryLog());
        DB::disableQueryLog();
        
        // Should be < 20 queries total
        expect($queryCount)->toBeLessThan(20);
    });
    
    it('loading messages with eager load relations', function () {
        $user = User::factory()->create();
        $conv = Conversation::factory()->create(['created_by' => $user->id, 'admin_id' => $user->id]);
        
        Message::factory(10)->create([
            'conversation_id' => $conv->id,
            'user_id' => $user->id,
        ]);
        
        DB::enableQueryLog();
        
        $messages = $conv->messages()
            ->with(['user', 'attachments'])
            ->get();
        
        $queries = DB::getQueryLog();
        DB::disableQueryLog();
        
        // Should use 3 queries max: messages + users + attachments
        $selectQueries = array_filter($queries, fn ($q) => str_starts_with(strtoupper(trim($q['query'])), 'SELECT'));
        expect(count($selectQueries))->toBeLessThanOrEqual(3);
    });
    
    it('no N+1 when accessing conversation users multiple times', function () {
        $user = User::factory()->create();
        $conv = Conversation::factory()->create(['created_by' => $user->id, 'admin_id' => $user->id]);
        $users = User::factory(10)->create();
        
        $conv->users()->attach($users->pluck('id'));
        
        DB::enableQueryLog();
        
        // Access users multiple times - should use eager loaded data
        foreach ($conv->users as $u) {
            $name = $u->name;
        }
        
        $queries = DB::getQueryLog();
        DB::disableQueryLog();
        
        $selectQueries = array_filter($queries, fn ($q) => str_starts_with(strtoupper(trim($q['query'])), 'SELECT'));
        // First load + join should be ~2 queries, not 11
        expect(count($selectQueries))->toBeLessThan(5);
    });
});
