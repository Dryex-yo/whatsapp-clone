<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * This migration enhances the conversations table with additional fields for better UX
     */
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            // Add group avatar/icon
            $table->string('avatar')->nullable()->after('is_group');
            
            // Add user who created the group (useful for group management)
            $table->foreignId('created_by')->nullable()->after('avatar')->constrained('users')->cascadeOnDelete();
            
            // Add description for groups
            $table->text('description')->nullable()->after('created_by');
            
            // Add index for faster queries
            $table->index('is_group');
            $table->index('created_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropForeignKeyConstraints();
            $table->dropIndex(['is_group']);
            $table->dropIndex(['created_by']);
            $table->dropColumn(['avatar', 'created_by', 'description']);
        });
    }
};
