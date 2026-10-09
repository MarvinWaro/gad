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

test('the site names the office running it, from config', function () {
    config(['phlgadis.operator' => ['name' => 'CHED Regional Office IV', 'short_name' => 'CHEDRO IV', 'hotline' => '+63 2 1234 5678', 'email' => 'ro4@example.test']]);

    $this->get(route('help.faq'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('operator.name', 'CHED Regional Office IV')
            ->where('operator.short_name', 'CHEDRO IV')
            ->where('operator.email', 'ro4@example.test'));
});
