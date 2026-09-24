<?php

namespace App\Http\Requests;

use App\Models\Post;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'body' => ['nullable', 'string', 'max:5000', 'required_without:images'],
            'images' => ['nullable', 'array', 'max:'.Post::MAX_IMAGES],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'body.required_without' => __('Write something or add a photo.'),
            'images.max' => __('You can add up to :max photos.'),
            'images.*.image' => __('Each file must be a photo.'),
            'images.*.mimes' => __('Photos must be JPG, PNG, or WebP.'),
            'images.*.max' => __('Each photo must be 5 MB or smaller.'),
        ];
    }
}
