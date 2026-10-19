import assert from 'node:assert/strict';
import { test } from 'node:test';
import { placeOf } from '../../resources/js/components/survey/questionnaire.ts';

const directories = {
    regions: [{ id: 12, name: 'Regional Office XII', email: null }],
    heis: [
        {
            id: 7,
            name: 'Notre Dame of Marbel University',
            survey_region_id: 12,
        },
        { id: 8, name: 'Elsewhere College', survey_region_id: 13 },
    ],
    respondent_groups: [],
};

void test('an HEI account starts from its institution and that region', () => {
    assert.deepEqual(placeOf(directories, 7), { region_id: '12', hei_id: '7' });
});

void test('visitors, and institutions the survey does not list, start empty', () => {
    const empty = { region_id: '', hei_id: '' };

    assert.deepEqual(placeOf(directories, null), empty);
    // Deactivated, or not in this survey's list.
    assert.deepEqual(placeOf(directories, 99), empty);
    // Its region is not offered (no institutions while the HEI is required).
    assert.deepEqual(placeOf(directories, 8), empty);
});
