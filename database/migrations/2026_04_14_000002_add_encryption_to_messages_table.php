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
            // Store encrypted message body
            // Original body column should be kept for backward compatibility
            $table->text('encrypted_body')->nullable()->after('body');
            
            // Flag to indicate if message is encrypted
            $table->boolean('is_encrypted')->default(true)->after('encrypted_body');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['encrypted_body', 'is_encrypted']);
        });
    }
};
