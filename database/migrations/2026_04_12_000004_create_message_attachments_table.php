<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Create a dedicated table for message attachments/media
     */
    public function up(): void
    {
        Schema::create('message_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained('messages')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            
            // File information
            $table->string('file_name');
            $table->string('path'); // Storage path (relative to public disk)
            $table->string('mime_type');
            $table->unsignedBigInteger('size'); // File size in bytes
            
            // Media metadata
            $table->string('type'); // image, video, audio, document, etc.
            $table->unsignedInteger('width')->nullable(); // For images
            $table->unsignedInteger('height')->nullable(); // For images
            $table->decimal('duration', 8, 2)->nullable(); // For videos/audio
            
            // Thumbnail for images/videos
            $table->string('thumbnail_path')->nullable();
            
            // Processing status
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->text('processing_error')->nullable();
            
            $table->timestamps();
            
            // Indexes for queries
            $table->index('message_id');
            $table->index('user_id');
            $table->index('type');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('message_attachments');
    }
};
