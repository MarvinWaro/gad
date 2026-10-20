import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    heiTourSteps,
    visibleSteps,
    withTour,
} from '../../resources/js/lib/hei-tour.ts';

const titles = (steps: { title: string }[]) => steps.map((step) => step.title);

void test('the tour greets by first name, then shows the home, the menus and the account', () => {
    assert.deepEqual(titles(heiTourSteps('Ana')), [
        'Welcome to PHLGADIS, Ana',
        'Share a GAD activity',
        'Your feed',
        'Law surveys',
        'Events',
        'GAD Quest',
        'Monitoring',
        'Quick links',
        'Notifications',
        'You',
    ]);
});

void test('steps whose target is not on screen are left out, the welcome never', () => {
    const steps = heiTourSteps('Ana');

    // An HEI User has no Monitoring tab and no Quick links.
    const member = visibleSteps(
        steps,
        (target) => target !== 'monitoring' && target !== 'quick-links',
    );
    assert.equal(member.length, 8);
    assert.ok(!titles(member).includes('Monitoring'));
    assert.ok(!titles(member).includes('Quick links'));

    // A Focal person has both.
    const focal = titles(visibleSteps(steps, () => true));
    assert.ok(focal.includes('Monitoring') && focal.includes('Quick links'));

    // With nothing on screen, only the welcome stays.
    assert.deepEqual(titles(visibleSteps(steps, () => false)), [
        'Welcome to PHLGADIS, Ana',
    ]);
});

void test('the replay links ask the home for the tour', () => {
    assert.equal(withTour('/dashboard'), '/dashboard?tour=1');
});
