<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * This migration adds advanced messaging features
     */
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            // Store file path/URL if type is image or file
            $table->string('file_path')->nullable()->after('type');
            
            // File size for display purposes (in bytes)
            $table->integer('file_size')->nullable()->after('file_path');
            
            // MIME type for files
            $table->string('mime_type')->nullable()->after('file_size');
            
            // Track edited messages
            $table->timestamp('edited_at')->nullable()->after('read_at');
            
            // Soft delete support for deleted messages (can show "This message was deleted")
            $table->softDeletes()->after('edited_at');
            
            // Indexes for better query performance
            $table->index('conversation_id');
            $table->index('user_id');
            $table->index('read_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['conversation_id']);
            $table->dropIndex(['user_id']);
            $table->dropIndex(['read_at']);
            $table->dropColumn(['file_path', 'file_size', 'mime_type', 'edited_at']);
            $table->dropSoftDeletes();
        });
    }
};
