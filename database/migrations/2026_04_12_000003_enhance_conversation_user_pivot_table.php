<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * This migration enhances the pivot table with user-specific conversation data
     */
    public function up(): void
    {
        Schema::table('conversation_user', function (Blueprint $table) {
            // Track when user joined the group
            $table->timestamp('joined_at')->nullable()->after('user_id');
            
            // Track last message read by this user (for read receipts)
            $table->foreignId('last_read_message_id')->nullable()->after('joined_at')->constrained('messages')->nullOnDelete();
            
            // User role in the conversation (admin, moderator, member)
            $table->string('role')->default('member')->after('last_read_message_id');
            
            // Soft mute conversations for users
            $table->boolean('is_muted')->default(false)->after('role');
            
            // Pin conversation to top
            $table->boolean('is_pinned')->default(false)->after('is_muted');
            
            // Add indexes
            $table->index(['conversation_id', 'user_id']);
            $table->index('role');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('conversation_user', function (Blueprint $table) {
            $table->dropForeignKeyConstraints();
            $table->dropIndex(['conversation_id', 'user_id']);
            $table->dropIndex(['role']);
            $table->dropColumn(['joined_at', 'last_read_message_id', 'role', 'is_muted', 'is_pinned']);
        });
    }
};
