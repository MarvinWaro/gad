<?php

namespace App\Enums;

/**
 * The reactions a member can give a post, one each. The API exchanges these
 * codes; resources/js/lib/post-reactions.ts mirrors them with names and emoji.
 */
enum PostReactionType: string
{
    case Heart = 'heart';
    case Care = 'care';
    case Clap = 'clap';
}
