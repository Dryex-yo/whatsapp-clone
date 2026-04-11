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
        Schema::table('users', function (Blueprint $table) {
            // Add avatar URL for profile pictures
            $table->string('avatar')->nullable()->after('email');
            
            // Track last seen timestamp for online status indicator
            $table->timestamp('last_seen')->nullable()->after('avatar');
            
            // Store phone number for WhatsApp-like identification
            $table->string('phone')->unique()->nullable()->after('last_seen');
            
            // Add indexes for better query performance
            $table->index('phone');
            $table->index('last_seen');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['phone']);
            $table->dropIndex(['last_seen']);
            $table->dropColumn(['avatar', 'last_seen', 'phone']);
        });
    }
};
