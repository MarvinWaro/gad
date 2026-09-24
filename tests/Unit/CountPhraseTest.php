<?php

use App\Support\CountPhrase;

test('counts read as a phrase, leaving out zeros', function (array $counts, string $phrase) {
    expect(CountPhrase::of($counts))->toBe($phrase);
})->with([
    [['post' => 1], '1 post'],
    [['post' => 3, 'comment' => 1], '3 posts and 1 comment'],
    [['survey response' => 12, 'user account' => 3, 'post' => 4], '12 survey responses, 3 user accounts and 4 posts'],
    [['post' => 0, 'comment' => 2], '2 comments'],
    [['post' => 1200], '1,200 posts'],
]);
