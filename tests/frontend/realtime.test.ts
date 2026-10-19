import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createCatchUp } from '../../resources/js/lib/realtime.ts';

/** A clock and timers the test moves by hand. */
function fakeTime() {
    let now = 0;
    let timers: { at: number; run: () => void }[] = [];

    return {
        now: () => now,
        setTimer: (run: () => void, ms: number) => {
            const timer = { at: now + ms, run };
            timers.push(timer);

            return timer;
        },
        clearTimer: (timer: unknown) => {
            timers = timers.filter((item) => item !== timer);
        },
        advance(ms: number) {
            now += ms;
            const due = timers.filter((timer) => timer.at <= now);
            timers = timers.filter((timer) => timer.at > now);
            due.forEach((timer) => timer.run());
        },
    };
}

void test('a burst of signals runs the catch-up once, shortly after', () => {
    const time = fakeTime();
    let runs = 0;
    const catchUp = createCatchUp(() => runs++, {
        delay: 400,
        hidden: () => false,
        ...time,
    });

    catchUp.request();
    catchUp.request();
    catchUp.request();
    time.advance(399);
    assert.equal(runs, 0);
    time.advance(1);
    assert.equal(runs, 1);
});

void test('a gap keeps busy pages from asking too often', () => {
    const time = fakeTime();
    let runs = 0;
    const catchUp = createCatchUp(() => runs++, {
        delay: 400,
        gap: 60_000,
        hidden: () => false,
        ...time,
    });

    catchUp.request();
    time.advance(400);
    catchUp.request();
    time.advance(30_000);
    assert.equal(runs, 1);
    time.advance(30_000);
    assert.equal(runs, 2);
});

void test('a hidden tab waits, and catches up once when looked at again', () => {
    const time = fakeTime();
    let hidden = true;
    let runs = 0;
    const catchUp = createCatchUp(() => runs++, {
        delay: 400,
        hidden: () => hidden,
        ...time,
    });

    catchUp.request();
    catchUp.request();
    time.advance(1_000);
    assert.equal(runs, 0);

    hidden = false;
    catchUp.resume();
    catchUp.resume();
    time.advance(400);
    assert.equal(runs, 1);

    // Nothing missed: coming back again asks nothing.
    catchUp.resume();
    time.advance(400);
    assert.equal(runs, 1);
});

void test('leaving the page cancels a catch-up still waiting', () => {
    const time = fakeTime();
    let runs = 0;
    const catchUp = createCatchUp(() => runs++, {
        hidden: () => false,
        ...time,
    });

    catchUp.request();
    catchUp.cancel();
    time.advance(1_000);
    assert.equal(runs, 0);
});
