<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * This migration adds the status column for message delivery tracking
     */
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            // Add status column with enum values: sent, delivered, read
            // The status is independent of read_at timestamp
            // sent = message created, delivered = recipient opened conversation, read = recipient read message
            $table->enum('status', ['sent', 'delivered', 'read'])->default('sent')->after('type');
            
            // Index for efficient status queries
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropColumn('status');
        });
    }
};
