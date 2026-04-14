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
            // Add bio/status field
            $table->string('bio')->nullable()->after('name');
            
            // Add last seen privacy setting (everyone, contacts, nobody)
            $table->enum('last_seen_privacy', ['everyone', 'contacts', 'nobody'])
                  ->default('everyone')
                  ->after('last_seen');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['bio', 'last_seen_privacy']);
        });
    }
};
