<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Site operator
    |--------------------------------------------------------------------------
    |
    | The CHED office that runs this PHLGADIS site: named in the public footer,
    | the help pages and the rating thanks, with its public contact details.
    | Each deployment sets its own; regional offices' details stay with their
    | regions (Settings → Regions).
    |
    */

    'operator' => [
        'name' => env('PHLGADIS_OPERATOR_NAME', 'CHED Regional Office XII'),
        'short_name' => env('PHLGADIS_OPERATOR_SHORT_NAME', 'CHEDRO XII'),
        'hotline' => env('PHLGADIS_OPERATOR_HOTLINE', '+63 936 616 7199'),
        'email' => env('PHLGADIS_OPERATOR_EMAIL', 'chedro12@ched.gov.ph'),
    ],

];
