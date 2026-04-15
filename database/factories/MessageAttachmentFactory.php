<?php

namespace Database\Factories;

use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MessageAttachment>
 */
class MessageAttachmentFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\App\Models\MessageAttachment>
     */
    protected $model = MessageAttachment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'message_id' => Message::factory(),
            'user_id' => User::factory(),
            'file_name' => $this->faker->word() . '.jpg',
            'path' => 'messages/' . $this->faker->sha256() . '.jpg',
            'mime_type' => 'image/jpeg',
            'size' => $this->faker->numberBetween(10000, 5000000),
            'type' => 'image',
            'width' => 1920,
            'height' => 1080,
            'duration' => null,
            'thumbnail_path' => 'messages/thumbs/' . $this->faker->sha256() . '.jpg',
            'status' => 'completed',
            'processing_error' => null,
        ];
    }

    /**
     * Indicate that the attachment is an image.
     */
    public function image(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'type' => 'image',
                'mime_type' => $this->faker->randomElement(['image/jpeg', 'image/png', 'image/webp']),
                'width' => $this->faker->numberBetween(800, 3840),
                'height' => $this->faker->numberBetween(600, 2160),
            ];
        });
    }

    /**
     * Indicate that the attachment is a video.
     */
    public function video(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'type' => 'video',
                'mime_type' => 'video/mp4',
                'duration' => $this->faker->numberBetween(5, 600),
                'width' => 1920,
                'height' => 1080,
            ];
        });
    }

    /**
     * Indicate that the attachment is audio.
     */
    public function audio(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'type' => 'audio',
                'mime_type' => 'audio/mpeg',
                'duration' => $this->faker->numberBetween(10, 600),
                'width' => null,
                'height' => null,
            ];
        });
    }

    /**
     * Indicate that the attachment is a document.
     */
    public function document(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'type' => 'document',
                'mime_type' => $this->faker->randomElement(['application/pdf', 'application/msword', 'text/plain']),
                'width' => null,
                'height' => null,
                'duration' => null,
            ];
        });
    }
}
