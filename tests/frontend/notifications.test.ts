import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    badgeLabel,
    bellLabel,
    unreadSentence,
} from '../../resources/js/lib/notifications.ts';

void test('the bell counts to nine, then says 9+', () => {
    assert.equal(badgeLabel(1), '1');
    assert.equal(badgeLabel(9), '9');
    assert.equal(badgeLabel(10), '9+');
    assert.equal(badgeLabel(1250), '9+');
});

void test('the bell and the page say how many are unread in words', () => {
    assert.equal(bellLabel(0), 'Notifications');
    assert.equal(bellLabel(3), 'Notifications, 3 unread');
    assert.equal(unreadSentence(0), 'You’re all caught up');
    assert.equal(unreadSentence(1), 'You have 1 unread notification');
    assert.equal(unreadSentence(1250), 'You have 1,250 unread notifications');
});
