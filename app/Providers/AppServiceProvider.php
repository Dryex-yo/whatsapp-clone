<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use App\Models\Message;
use App\Models\User;
use App\Models\Conversation;
use App\Policies\MessagePolicy;
use App\Observers\UserObserver;
use App\Observers\ConversationObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Message::class => MessagePolicy::class,
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Register policy gates
        $this->registerPolicies();

        // Register model observers for cache invalidation
        $this->registerObservers();
    }

    /**
     * Register the application's policies.
     */
    protected function registerPolicies(): void
    {
        foreach ($this->policies as $model => $policy) {
            Gate::policy($model, $policy);
        }
    }

    /**
     * Register observers for automatic cache invalidation
     * 
     * Ensures caches are cleared when models are updated/deleted
     */
    private function registerObservers(): void
    {
        // Observe User model for cache invalidation
        User::observe(UserObserver::class);

        // Observe Conversation model for cache invalidation
        Conversation::observe(ConversationObserver::class);
    }
}

