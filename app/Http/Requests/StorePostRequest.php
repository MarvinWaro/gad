<?php

namespace App\Http\Requests;

use App\Enums\PostFeeling;
use App\Enums\UserStatus;
use App\Models\Post;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'feeling' => ['nullable', Rule::enum(PostFeeling::class)],
            'tags' => ['nullable', 'array', 'max:'.Post::MAX_TAGS],
            // Only approved, active accounts can be tagged, and never the author.
            'tags.*' => [
                'integer',
                'distinct',
                Rule::exists('users', 'id')->where('status', UserStatus::Active->value),
                Rule::notIn([$this->user()?->id]),
            ],
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
            'feeling.enum' => __('Choose a feeling from the list.'),
            'tags.max' => __('You can tag up to :max people.'),
            'tags.*.distinct' => __('Each person can be tagged once.'),
            'tags.*.exists' => __('Only active accounts can be tagged.'),
            'tags.*.not_in' => __('You cannot tag yourself.'),
        ];
    }
}
