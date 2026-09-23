<?php

namespace App\Http\Requests\Settings;

class UpdateRoleRequest extends StoreRoleRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('roles.update') === true;
    }
}
