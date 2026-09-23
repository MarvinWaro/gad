import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    fromLines,
    type SurveyOption,
    toLines,
} from '../../resources/js/lib/survey-options.ts';

const experiences: SurveyOption[] = [
    { value: 'catcalling', label: 'Catcalling or Wolf-whistling (Pagsipol)' },
    { value: 'groping', label: 'Groping (Panghipo)' },
    {
        value: 'other-relative',
        label: 'Other relative (Specify)',
        requires_text: true,
    },
];

void test('round-tripping the editor leaves stored answer keys untouched', () => {
    const parsed = fromLines(toLines(experiences), experiences);

    assert.deepEqual(
        parsed.map((option) => option.value),
        ['catcalling', 'groping', 'other-relative'],
    );
    assert.equal(parsed[2].requires_text, true);
});

void test('renaming a label keeps the key the collected responses point at', () => {
    const renamed = toLines(experiences).replace(
        'Catcalling or Wolf-whistling (Pagsipol)',
        'Catcalling (Pagsipol)',
    );
    const parsed = fromLines(renamed, experiences);

    assert.equal(parsed[0].value, 'catcalling');
    assert.equal(parsed[0].label, 'Catcalling (Pagsipol)');
    assert.equal(parsed[1].value, 'groping');
});

void test('reordering lines carries each key along with its label', () => {
    const parsed = fromLines(
        ['Groping (Panghipo)', 'Catcalling or Wolf-whistling (Pagsipol)'].join(
            '\n',
        ),
        experiences,
    );

    assert.deepEqual(
        parsed.map((option) => option.value),
        ['groping', 'catcalling'],
    );
});

void test('new lines get generated keys and blank lines are dropped', () => {
    const parsed = fromLines(
        ['Groping (Panghipo)', '', '  Stalking  '].join('\n'),
        experiences,
    );

    assert.deepEqual(parsed, [
        { value: 'groping', label: 'Groping (Panghipo)' },
        { value: 'catcalling', label: 'Stalking' },
    ]);
});

void test('appending a choice after a blank line preserves earlier answer keys', () => {
    const parsed = fromLines(
        `${toLines(experiences)}\n\nNew experience`,
        experiences,
    );

    assert.deepEqual(
        parsed.map((option) => option.value),
        ['catcalling', 'groping', 'other-relative', 'new-experience'],
    );
    assert.equal(parsed[2].requires_text, true);
});

void test('keys stay unique even when labels collide or carry no letters', () => {
    const parsed = fromLines(['Other', 'Other', '???', '???'].join('\n'));

    assert.deepEqual(
        parsed.map((option) => option.value),
        ['other', 'other-2', 'option-3', 'option-4'],
    );
});

void test('an emptied textarea clears the options instead of throwing', () => {
    assert.deepEqual(fromLines('   \n  \n', experiences), []);
    assert.deepEqual(fromLines(''), []);
    assert.equal(toLines(undefined), '');
});
