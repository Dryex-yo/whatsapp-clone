<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds strategic indexes to optimize message retrieval and reduce query times.
     * These indexes address the most common query patterns in the chat application:
     * - Fetching messages by conversation (with pagination)
     * - Filtering by message status
     * - Finding messages by sender
     * - Time-based queries
     * 
     * Index Strategy:
     * 1. (conversation_id, created_at DESC) - Primary access pattern for message retrieval
     * 2. (conversation_id, status, created_at DESC) - For status-based queries
     * 3. (user_id, created_at DESC) - For "messages by sender" queries
     * 4. (conversation_id, read_at) - For read receipt aggregations
     */
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            // Composite index for conversation message retrieval with pagination
            // This is the most frequently used query pattern
            // Query: SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC
            $table->index(['conversation_id', 'created_at'], 'idx_messages_conversation_created');

            // Composite index for status-based queries within conversations
            // Query: SELECT COUNT(*) FROM messages WHERE conversation_id = ? AND status = 'delivered'
            $table->index(['conversation_id', 'status', 'created_at'], 'idx_messages_conversation_status_created');

            // Index for sender-based message queries
            // Query: SELECT * FROM messages WHERE user_id = ? ORDER BY created_at DESC (for user message history)
            $table->index(['user_id', 'created_at'], 'idx_messages_sender_created');

            // Composite index for read receipt checks
            // Query: SELECT COUNT(*) FROM messages WHERE conversation_id = ? AND user_id != ? AND read_at IS NULL
            $table->index(['conversation_id', 'user_id', 'read_at'], 'idx_messages_unread_count');

            // Index for ephemeral message cleanup (messages that should disappear)
            // Query: SELECT * FROM messages WHERE is_ephemeral = true AND disappears_at < NOW()
            $table->index(['is_ephemeral', 'disappears_at'], 'idx_messages_ephemeral_cleanup');

            // Index for soft delete queries (messages not deleted)
            // This ensures soft delete queries are efficient
            $table->index(['conversation_id', 'deleted_at'], 'idx_messages_conversation_not_deleted');
        });

        // Add indexes to conversation_user pivot table for efficient user lookups
        Schema::table('conversation_user', function (Blueprint $table) {
            // Index for finding all conversations of a user
            // Query: SELECT * FROM conversation_user WHERE user_id = ?
            $table->index(['user_id', 'is_muted', 'is_pinned'], 'idx_conversation_user_lookup');

            // Index for muted conversations filtering
            // Used in chat index to exclude muted conversations
            $table->index(['user_id', 'is_muted', 'conversation_id'], 'idx_conversation_user_muted');

            // Index for pinned conversations (sorting by pinned first)
            // Query: SELECT * FROM conversation_user WHERE user_id = ? ORDER BY is_pinned DESC, updated_at DESC
            $table->index(['user_id', 'is_pinned', 'updated_at'], 'idx_conversation_user_pinned');

            // Index for finding users in a specific conversation
            // Query: SELECT * FROM conversation_user WHERE conversation_id = ?
            $table->index(['conversation_id', 'role'], 'idx_conversation_members_role');
        });

        // Add indexes to message_attachments for efficient lookups
        Schema::table('message_attachments', function (Blueprint $table) {
            // Composite index for finding attachments in a conversation
            // Required for efficient media gallery queries
            $table->index(['message_id', 'status'], 'idx_attachments_message_status');

            // Index for finding all media by type in a conversation
            // Enables efficient media gallery filtering
            $table->index(['user_id', 'type', 'created_at'], 'idx_attachments_user_type_created');
        });

        // Add index to conversations table for group queries
        Schema::table('conversations', function (Blueprint $table) {
            // Index for filtering active groups
            $table->index(['is_group', 'created_at'], 'idx_conversations_group_created');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex('idx_messages_conversation_created');
            $table->dropIndex('idx_messages_conversation_status_created');
            $table->dropIndex('idx_messages_sender_created');
            $table->dropIndex('idx_messages_unread_count');
            $table->dropIndex('idx_messages_ephemeral_cleanup');
            $table->dropIndex('idx_messages_conversation_not_deleted');
        });

        Schema::table('conversation_user', function (Blueprint $table) {
            $table->dropIndex('idx_conversation_user_lookup');
            $table->dropIndex('idx_conversation_user_muted');
            $table->dropIndex('idx_conversation_user_pinned');
            $table->dropIndex('idx_conversation_members_role');
        });

        Schema::table('message_attachments', function (Blueprint $table) {
            $table->dropIndex('idx_attachments_message_status');
            $table->dropIndex('idx_attachments_user_type_created');
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->dropIndex('idx_conversations_group_created');
        });
    }
};
