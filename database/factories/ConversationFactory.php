<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Conversation>
 */
class ConversationFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\App\Models\Conversation>
     */
    protected $model = Conversation::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->sentence(3),
            'is_group' => $this->faker->boolean(30),
            'avatar' => $this->faker->imageUrl(200, 200, 'avatars'),
            'created_by' => User::factory(),
            'admin_id' => User::factory(),
            'description' => $this->faker->sentence(),
        ];
    }

    /**
     * Indicate that the conversation is a group.
     */
    public function group(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'is_group' => true,
                'name' => $this->faker->sentence(3),
            ];
        });
    }

    /**
     * Indicate that the conversation is direct message (1-on-1).
     */
    public function direct(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'is_group' => false,
                'name' => null,
            ];
        });
    }
}
