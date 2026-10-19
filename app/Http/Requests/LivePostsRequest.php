<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * The posts a feed already shows and was told changed, to swap in fresh.
 */
class LivePostsRequest extends FormRequest
{
    /** Posts asked for at once: a feed asks only for those it shows. */
    public const MAX = 20;

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'max:'.self::MAX],
            'ids.*' => ['required', 'ulid'],
        ];
    }

    /** @return list<string> */
    public function ids(): array
    {
        // Stored lowercase, as HasUlids makes them.
        return array_values(array_unique(array_map(
            fn (mixed $id): string => strtolower((string) $id),
            (array) $this->validated('ids'),
        )));
    }
}
