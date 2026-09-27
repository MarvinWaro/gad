<?php

use Inertia\Testing\AssertableInertia as Assert;

test('guests can open each resource page', function (string $route, string $component) {
    $this->get(route($route))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component($component));
})->with([
    'definition of terms' => ['resources.terms', 'resources/definition-of-terms'],
    'republic acts' => ['resources.acts', 'resources/gad-enabling-republic-acts'],
    'issuances' => ['resources.issuances', 'resources/issuances'],
    'manuals' => ['resources.manuals', 'resources/manuals'],
]);

test('the resource pages link to documents that exist', function (string $document) {
    expect(public_path("assets/document/{$document}.pdf"))->toBeFile();
})->with(['ra7877', 'ra9262', 'ra9710', 'ra11313', 'cmo_no._01_s._2015', 'cmo_no._3_s._2022', 'gmef', 'gcaf']);
