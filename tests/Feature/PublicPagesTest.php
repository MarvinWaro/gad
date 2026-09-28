<?php

use Inertia\Testing\AssertableInertia as Assert;

test('guests can open the FAQ and About pages', function (string $route, string $component) {
    $this->get(route($route))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component($component));
})->with([
    'FAQ' => ['help.faq', 'help/faq'],
    'About' => ['about', 'about'],
    'GAD Herstory' => ['about.herstory', 'about/gad-herstory'],
]);
