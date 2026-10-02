<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** Whether a post stays off the public homepage's stories. */
class UpdatePostHomepageRequest extends FormRequest
{
    public function authorize(): bool
    {
        $post = $this->route('post');

        return $this->user()?->can('hideFromHomepage', $post) ?? false;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'hidden' => ['required', 'boolean'],
        ];
    }
}
