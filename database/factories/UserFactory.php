<?php

namespace Database\Factories;

use App\Enums\UserStatus;
use App\Models\SurveyRegion;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
            'status' => UserStatus::Active,
        ];
    }

    /**
     * Indicate that the account is awaiting administrator approval.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => UserStatus::Pending,
        ]);
    }

    /**
     * Indicate that the account has been deactivated.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => UserStatus::Inactive,
        ]);
    }

    /**
     * Place the staff account in the Central Office, which covers every region.
     */
    public function nationalOffice(): static
    {
        return $this->state(fn (array $attributes) => [
            'national_access' => true,
            'survey_region_id' => null,
        ]);
    }

    /**
     * Place the staff account in a regional office.
     */
    public function regionalOffice(SurveyRegion|int $region): static
    {
        return $this->state(fn (array $attributes) => [
            'national_access' => false,
            'survey_region_id' => $region instanceof SurveyRegion ? $region->id : $region,
        ]);
    }

    /**
     * The account still has the temporary password an administrator gave it.
     */
    public function mustChangePassword(): static
    {
        return $this->state(fn (array $attributes) => [
            'must_change_password' => true,
        ]);
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Indicate that the model has two-factor authentication configured.
     */
    public function withTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => encrypt('secret'),
            'two_factor_recovery_codes' => encrypt(json_encode(['recovery-code-1'])),
            'two_factor_confirmed_at' => now(),
        ]);
    }
}
