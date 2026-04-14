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
        Schema::table('conversations', function (Blueprint $table) {
            // Add admin_id column - references the user who created/administrates the group
            // For 1-on-1 conversations, this will be NULL
            $table->foreignId('admin_id')->nullable()->after('created_by')->constrained('users')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropForeignKeyIfExists(['admin_id']);
            $table->dropColumn('admin_id');
        });
    }
};
