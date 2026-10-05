<?php

namespace App\Http\Requests;

use App\Enums\FeedScope;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/** The Gender Mainstreaming feed's scope: everyone's posts, or the people followed. */
class FeedScopeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'feed' => FeedScope::rules(),
        ];
    }
}
