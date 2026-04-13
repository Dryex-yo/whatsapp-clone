<?php

namespace Intervention\Image;

use Intervention\Image\Interfaces\DriverInterface;

class ImageManager {
    public function __construct(DriverInterface|string $driver = '') {}
    public function read(string $path) {}
}

namespace Intervention\Image\Interfaces;

interface DriverInterface {
    public function id(): string;
    public function config(): array;
    public function specialize(string $className): mixed;
    public function specializeMultiple(array $classNames): array;
    public function createImage(int $width, int $height, mixed $background = null);
    public function createAnimation(int $loops = 0);
    public function handleInput(mixed $input);
    public function colorProcessor();
    public function fontProcessor();
    public function checkHealth();
    public function supports(string $format): bool;
}

namespace Intervention\Image\Drivers;

use Intervention\Image\Interfaces\DriverInterface;

class GdDriver implements DriverInterface {
    public function id(): string { return 'gd'; }
    public function config(): array { return []; }
    public function specialize(string $className): mixed { return null; }
    public function specializeMultiple(array $classNames): array { return []; }
    public function createImage(int $width, int $height, mixed $background = null) {}
    public function createAnimation(int $loops = 0) {}
    public function handleInput(mixed $input) {}
    public function colorProcessor() {}
    public function fontProcessor() {}
    public function checkHealth() {}
    public function supports(string $format): bool { return true; }
}


