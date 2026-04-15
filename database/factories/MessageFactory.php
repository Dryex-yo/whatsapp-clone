<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Message>
 */
class MessageFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\App\Models\Message>
     */
    protected $model = Message::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'conversation_id' => Conversation::factory(),
            'user_id' => User::factory(),
            'body' => $this->faker->sentence(),
            'encrypted_body' => null,
            'is_encrypted' => false,
            'type' => 'text',
            'status' => $this->faker->randomElement(['sent', 'delivered', 'read']),
            'file_path' => null,
            'file_size' => null,
            'mime_type' => null,
            'read_at' => null,
            'edited_at' => null,
            'deleted_at' => null,
            'disappears_at' => null,
            'is_ephemeral' => false,
        ];
    }

    /**
     * Indicate that the message is encrypted.
     */
    public function encrypted(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'is_encrypted' => true,
                'encrypted_body' => base64_encode($this->faker->sentence()),
                'body' => null,
            ];
        });
    }

    /**
     * Indicate that the message is ephemeral (disappearing).
     */
    public function ephemeral(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'is_ephemeral' => true,
                'disappears_at' => now()->addDay(),
            ];
        });
    }

    /**
     * Indicate that the message is read.
     */
    public function read(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'read_at' => now(),
                'status' => 'read',
            ];
        });
    }

    /**
     * Indicate that the message has an image attachment.
     */
    public function withImage(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'type' => 'image',
                'file_path' => 'messages/' . $this->faker->sha256() . '.jpg',
                'file_size' => $this->faker->numberBetween(10000, 5000000),
                'mime_type' => 'image/jpeg',
            ];
        });
    }

    /**
     * Indicate that the message has an audio attachment.
     */
    public function withAudio(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'type' => 'audio',
                'file_path' => 'messages/' . $this->faker->sha256() . '.mp3',
                'file_size' => $this->faker->numberBetween(50000, 10000000),
                'mime_type' => 'audio/mpeg',
            ];
        });
    }
}
