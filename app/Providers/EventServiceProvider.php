<?php

namespace App\Providers;

use App\Events\ConversationOpened;
use App\Events\MessageStatusUpdated;
use App\Listeners\ConversationOpenedHandler;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        ConversationOpened::class => [
            ConversationOpenedHandler::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }
}
