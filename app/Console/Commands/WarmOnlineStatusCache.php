<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Conversation;
use App\Services\OnlineStatusCacheService;
use App\Services\UserListCacheService;
use Illuminate\Console\Command;

/**
 * Artisan Command: cache:warm-online-status
 * 
 * Warms up Redis cache with online status and user list data
 * Useful for pre-loading cache after server restart
 */
class WarmOnlineStatusCache extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cache:warm-online-status
                            {--all : Warm cache for all users}
                            {--conversation= : Warm cache for specific conversation ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Pre-load online status and user lists into Redis cache for better performance';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $onlineStatusService = app(OnlineStatusCacheService::class);
        $userListService = app(UserListCacheService::class);

        try {
            if ($this->option('conversation')) {
                return $this->warmConversationCache(
                    (int) $this->option('conversation'),
                    $onlineStatusService,
                    $userListService
                );
            }

            if ($this->option('all')) {
                return $this->warmAllCache($onlineStatusService, $userListService);
            }

            return $this->warmAllCache($onlineStatusService, $userListService);
        } catch (\Exception $e) {
            $this->error('Error warming cache: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }

    /**
     * Warm cache for all conversations
     */
    private function warmAllCache(
        OnlineStatusCacheService $onlineStatusService,
        UserListCacheService $userListService
    ): int {
        $this->info('Starting cache warm-up for all conversations...');

        $totalConversations = Conversation::count();
        $this->info("Found {$totalConversations} conversations");

        $progressBar = $this->output->createProgressBar($totalConversations);
        $progressBar->start();

        Conversation::chunk(50, function ($conversations) use (
            $onlineStatusService,
            $userListService,
            $progressBar
        ) {
            foreach ($conversations as $conversation) {
                // Warm user list cache
                $userListService->getConversationMembers($conversation, withStatus: true);

                // Warm online status cache
                $onlineStatusService->getConversationOnlineMembers($conversation);

                // Warm count cache
                $userListService->getConversationMemberCount($conversation);

                $progressBar->advance();
            }
        });

        $progressBar->finish();
        $this->newLine();

        // Warm global user online statuses
        $this->info('Warming individual user online statuses...');
        $totalUsers = User::count();
        $userProgressBar = $this->output->createProgressBar($totalUsers);
        $userProgressBar->start();

        User::chunk(100, function ($users) use ($onlineStatusService, $userProgressBar) {
            $userIds = $users->pluck('id')->toArray();
            $onlineStatusService->getMultipleStatuses($userIds);
            $userProgressBar->advance(count($userIds));
        });

        $userProgressBar->finish();
        $this->newLine();

        $this->info('✓ Cache warm-up completed successfully!');
        return Command::SUCCESS;
    }

    /**
     * Warm cache for specific conversation
     */
    private function warmConversationCache(
        int $conversationId,
        OnlineStatusCacheService $onlineStatusService,
        UserListCacheService $userListService
    ): int {
        $conversation = Conversation::find($conversationId);

        if (!$conversation) {
            $this->error("Conversation with ID {$conversationId} not found");
            return Command::FAILURE;
        }

        $conversationName = $conversation->name ?? 'Direct';
        $this->info("Warming cache for conversation: {$conversationName} (ID: {$conversationId})");

        // Warm user list cache
        $this->info('  → Loading user list with status...');
        $userListService->getConversationMembers($conversation, withStatus: true);

        // Warm online status cache
        $this->info('  → Loading online members...');
        $onlineStatusService->getConversationOnlineMembers($conversation);

        // Warm count cache
        $this->info('  → Loading member count...');
        $userListService->getConversationMemberCount($conversation);

        // Warm message pagination caches for first few pages
        $this->info('  → Pre-loading message pages...');
        for ($page = 1; $page <= 3; $page++) {
            cache()->tags(["conversation.{$conversationId}.messages"])->remember(
                "conversation.{$conversationId}.messages.page.{$page}.per.20",
                now()->addMinutes(5),
                function () use ($conversation) {
                    return $conversation->messages()
                        ->with(['user', 'attachments'])
                        ->orderBy('created_at', 'desc')
                        ->paginate(20);
                }
            );
        }

        $this->info('✓ Cache warm-up completed for conversation!');
        return Command::SUCCESS;
    }
}
