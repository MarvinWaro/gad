<?php

namespace App\Http\Requests;

use App\Enums\PostReactionType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReactToPostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(PostReactionType::class)],
        ];
    }

    public function reaction(): PostReactionType
    {
        return PostReactionType::from($this->string('type')->toString());
    }
}
