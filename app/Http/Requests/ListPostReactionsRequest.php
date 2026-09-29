<?php

namespace App\Http\Requests;

use App\Enums\PostReactionType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListPostReactionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'type' => ['nullable', Rule::enum(PostReactionType::class)],
            'cursor' => ['nullable', 'string', 'max:512'],
        ];
    }

    /** Only this reaction, or null for all of them. */
    public function reaction(): ?PostReactionType
    {
        return $this->filled('type') ? PostReactionType::from($this->string('type')->toString()) : null;
    }
}
