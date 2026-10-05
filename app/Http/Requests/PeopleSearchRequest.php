<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/** A search for people by name or institution: the header search and its page. */
class PeopleSearchRequest extends FormRequest
{
    /** Shortest search that is run; one letter would match half the country. */
    public const MIN_LENGTH = 2;

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:100'],
        ];
    }

    /** The search, or an empty string when it is too short to run. */
    public function search(): string
    {
        $search = trim($this->string('q')->toString());

        return mb_strlen($search) >= self::MIN_LENGTH ? $search : '';
    }
}
