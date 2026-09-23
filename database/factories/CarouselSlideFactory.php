<?php

namespace Database\Factories;

use App\Models\CarouselSlide;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<CarouselSlide> */
class CarouselSlideFactory extends Factory
{
    protected $model = CarouselSlide::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(3),
            'description' => fake()->sentence(10),
            'image_path' => 'carousel/example.jpg',
            'alt_text' => fake()->sentence(6),
            'link' => null,
            'is_active' => true,
            'sort_order' => 0,
            'created_by' => null,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => ['is_active' => false]);
    }
}
