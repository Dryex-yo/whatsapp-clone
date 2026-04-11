<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Tabel untuk menampung ID percakapan
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable(); // Untuk nama grup nanti
            $table->boolean('is_group')->default(false);
            $table->timestamps();
        });

        // Tabel Pivot: Menghubungkan User ke Conversation
        Schema::create('conversation_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });

        // Tabel Pesan
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // Pengirim
            $table->text('body')->nullable();
            $table->string('type')->default('text'); // text, image, file
            $table->timestamp('read_at')->nullable(); // Status centang biru
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_tables');
    }
};
