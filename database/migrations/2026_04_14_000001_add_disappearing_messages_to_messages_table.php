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
        Schema::table('messages', function (Blueprint $table) {
            // Timestamp for when the message should disappear (24 hours after creation)
            $table->dateTime('disappears_at')->nullable()->after('deleted_at');
            
            // Flag to enable/disable disappearing messages for a specific message
            $table->boolean('is_ephemeral')->default(false)->after('disappears_at');

            // Index for efficient scheduled task queries
            $table->index('disappears_at');
            $table->index('is_ephemeral');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['disappears_at']);
            $table->dropIndex(['is_ephemeral']);
            $table->dropColumn(['disappears_at', 'is_ephemeral']);
        });
    }
};
