<?php

use App\Models\User;
use App\Models\Conversation;
use Tests\TestCase;

test('rate limiting middleware is configured correctly', function () {
    // Test that RateLimitMessages middleware exists and is registered
    $middlewarePath = app_path('Http/Middleware/RateLimitMessages.php');
    expect(file_exists($middlewarePath))->toBeTrue();
    
    // Test that the middleware alias is registered in bootstrap
    $bootstrapPath = base_path('bootstrap/app.php');
    $content = file_get_contents($bootstrapPath);
    expect($content)->toContain('rate-limit-messages');
    expect($content)->toContain('RateLimitMessages::class');
});

test('blocked user cannot send messages', function () {
    $blocker = User::factory()->create();
    $blocked = User::factory()->create();
    $conversation = Conversation::create([
        'name' => 'Test',
        'is_group' => false,
        'created_by' => $blocker->id,
    ]);
    $conversation->users()->attach([$blocker->id, $blocked->id]);

    $blocker->blockUser($blocked);

    // Test the policy logic directly
    $policy = app(\App\Policies\MessagePolicy::class);
    $canCreate = $policy->create($blocked, $conversation);
    
    expect($canCreate)->toBeFalse();
});

test('user can block another user', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    
    expect($user->hasBlocked($other))->toBeFalse();
    
    $user->blockUser($other);
    
    expect($user->hasBlocked($other))->toBeTrue();
});

test('user can unblock another user', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    $user->blockUser($other);
    expect($user->hasBlocked($other))->toBeTrue();

    $user->unblockUser($other);
    expect($user->hasBlocked($other))->toBeFalse();
});

test('blocked user cannot see blocker online status', function () {
    $blocker = User::factory()->create(['last_seen' => now()]);
    $blocked = User::factory()->create();
    
    $blocker->blockUser($blocked);
    
    // Make a GET request as blocked user to create a proper request context
    /** @var TestCase $this */
    $response = $this
        ->actingAs($blocked)
        ->getJson('/api/user');
    
    // Now test the resource with proper context
    $resource = new \App\Http\Resources\UserResource($blocker);
    $data = $resource->toArray(request());
    
    expect($data['is_online'])->toBeFalse();
});

test('unblocked user can see online status', function () {
    $user1 = User::factory()->create(['last_seen' => now()]);
    $user2 = User::factory()->create();
    
    /** @var TestCase $this */
    $response = $this
        ->actingAs($user2)
        ->getJson('/api/user');
    
    $resource = new \App\Http\Resources\UserResource($user1);
    $data = $resource->toArray(request());
    
    expect($data['is_online'])->toBeTrue();
});

test('dompurify package is installed for xss prevention', function () {
    $packageJson = file_get_contents(base_path('package.json'));
    expect($packageJson)->toContain('dompurify');
});
