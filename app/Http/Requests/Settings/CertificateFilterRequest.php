<?php

namespace App\Http\Requests\Settings;

use App\Http\Requests\ListFilterRequest;

/**
 * The search and place filters of the certificate lists in Settings:
 * designs, signatories, and an event certificate's holders. The routes'
 * policies decide who may open them.
 */
class CertificateFilterRequest extends ListFilterRequest {}
