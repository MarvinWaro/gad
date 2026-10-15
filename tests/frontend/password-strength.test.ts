import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkPassword } from '../../resources/js/lib/password-strength.ts';

const onlyLength = 'minlength: 8;';
const strict =
    'minlength: 10; required: lower; required: upper; required: digit; required: special;';

void test('the list says exactly what the server requires', () => {
    assert.deepEqual(
        checkPassword('a', onlyLength).rules.map((rule) => rule.label),
        ['At least 8 characters'],
    );
    assert.deepEqual(
        checkPassword('a', strict).rules.map((rule) => rule.label),
        [
            'At least 10 characters',
            'A lowercase letter',
            'An uppercase letter',
            'A number',
            'A symbol',
        ],
    );
    // letters() is written "required: lower" alone: any letter will do.
    const letters = checkPassword('ABCDEFGH', 'minlength: 8; required: lower;');
    assert.deepEqual(letters.rules, [
        { label: 'At least 8 characters', met: true },
        { label: 'A letter', met: true },
    ]);
});

void test('the score grows with length and kinds of character', () => {
    assert.equal(checkPassword('short', onlyLength).level.label, 'Too short');
    assert.equal(checkPassword('password', onlyLength).level.label, 'Weak');
    assert.equal(checkPassword('password1', onlyLength).level.label, 'Fair');
    assert.equal(checkPassword('Password1', onlyLength).level.label, 'Good');
    assert.equal(
        checkPassword('Password1!longer', onlyLength).level.label,
        'Strong',
    );
});

void test('a password missing a required kind stays weak, however long', () => {
    const check = checkPassword('averylongpassword123', strict);

    assert.equal(check.level.label, 'Weak');
    assert.deepEqual(
        check.rules.filter((rule) => !rule.met).map((rule) => rule.label),
        ['An uppercase letter', 'A symbol'],
    );
});
