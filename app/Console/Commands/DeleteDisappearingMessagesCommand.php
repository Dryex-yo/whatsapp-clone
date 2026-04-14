<?php

namespace App\Console\Commands;

use App\Models\Message;
use Illuminate\Console\Command;

/**
 * DeleteDisappearingMessagesCommand
 * 
 * Scheduled task to delete ephemeral/disappearing messages that have expired.
 * Run this command via Laravel Scheduler in console/kernel.php
 * 
 * Example: $schedule->command('messages:delete-disappearing')->everyMinute();
 */
class DeleteDisappearingMessagesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'messages:delete-disappearing
                        {--force : Force deletion without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete ephemeral messages that have expired (disappears_at has passed)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting ephemeral message cleanup...');

        try {
            // Find all ephemeral messages that should be deleted
            $deletedCount = Message::where('is_ephemeral', true)
                ->whereNotNull('disappears_at')
                ->where('disappears_at', '<=', now())
                ->delete();

            $this->info("Successfully deleted {$deletedCount} expired ephemeral messages.");

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Error deleting ephemeral messages: ' . $e->getMessage());
            return self::FAILURE;
        }
    }
}
