<?php

namespace App\Http\Requests;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * The newest post a reader already has, by its place in the feed: when it
 * was posted and its id, which breaks ties within the same second.
 */
class NewerPostsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'after' => ['required', 'ulid'],
            'at' => ['required', 'date'],
        ];
    }

    public function postId(): string
    {
        // Stored lowercase, as HasUlids makes them.
        return strtolower($this->string('after')->toString());
    }

    public function postedAt(): CarbonImmutable
    {
        return CarbonImmutable::parse($this->string('at')->toString())->utc();
    }
}
