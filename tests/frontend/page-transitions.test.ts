import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pageTransitions } from '../../resources/js/lib/page-transitions.ts';

const fades = (options: Parameters<typeof pageTransitions>[1]) =>
    pageTransitions('/dashboard', options).viewTransition;

void test('moving to another page cross-fades', () => {
    assert.equal(fades({}), true);
    assert.equal(fades({ method: 'get', preserveScroll: true }), true);
});

void test('updates within a page never fade', () => {
    // Filters, partial reloads, infinite scroll, prefetching and forms.
    assert.equal(fades({ preserveState: true, replace: true }), false);
    assert.equal(fades({ only: ['notifications'] }), false);
    assert.equal(fades({ reset: ['posts'] }), false);
    assert.equal(fades({ async: true }), false);
    assert.equal(fades({ prefetch: true }), false);
    assert.equal(fades({ method: 'post' }), false);
    assert.equal(fades({ method: 'delete' }), false);
});

void test('a visit that asks for a transition keeps it', () => {
    assert.equal(fades({ method: 'post', viewTransition: true }), true);
});
