<?php

namespace App\Http\Requests\Settings;

use App\Models\Badge;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

/**
 * A badge as Settings → Badges writes it: its name, what it is for, an
 * optional picture (the browser shrinks it to a small square first), and
 * whether it is on. A regional office's badge is always its own region's;
 * the Central Office picks a region, or none for every region.
 */
class SaveBadgeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $badge = $this->route('badge');

        return $badge instanceof Badge
            ? $this->user()?->can('update', $badge) ?? false
            : $this->user()?->can('create', Badge::class) ?? false;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:60'],
            'description' => ['required', 'string', 'max:200'],
            'is_active' => ['required', 'boolean'],
            'region' => $this->writer()->national_access
                ? ['nullable', 'integer', 'exists:survey_regions,id']
                : ['nullable'],
            // Small raster pictures only: SVG can carry scripts.
            'image' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp', 'max:512', 'dimensions:min_width=64,min_height=64'],
            'remove_image' => ['nullable', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'image.mimes' => __('Choose a PNG, JPG or WebP picture.'),
            'image.max' => __('Choose a picture under 512 KB.'),
            'image.dimensions' => __('Choose a picture at least 64 pixels wide and tall.'),
        ];
    }

    /** @return array{name: string, description: string, is_active: bool} */
    public function badge(): array
    {
        return [
            'name' => (string) $this->validated('name'),
            'description' => (string) $this->validated('description'),
            'is_active' => $this->boolean('is_active'),
        ];
    }

    public function picture(): ?UploadedFile
    {
        $file = $this->file('image');

        return $file instanceof UploadedFile ? $file : null;
    }

    /** A regional office's own region; the Central Office's pick, or none for every region. */
    public function regionId(): ?int
    {
        $user = $this->writer();

        if (! $user->national_access) {
            return $user->survey_region_id;
        }

        $region = $this->validated('region');

        return $region !== null ? (int) $region : null;
    }

    private function writer(): User
    {
        /** @var User */
        return $this->user();
    }
}
