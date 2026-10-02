import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    emptyAnswers,
    feedbackStepOf,
    feedbackSteps,
    firstStepIssues,
} from '../../resources/js/lib/feedback.ts';
import type { FeedbackQuestions } from '../../resources/js/types/feedback.ts';

const questions: FeedbackQuestions = {
    choices: [
        {
            key: 'reading_ease',
            label: 'How difficult is reading characters on the screen?',
            options: [
                { value: 1, label: 'Very Hard' },
                { value: 4, label: 'Very Easy' },
            ],
        },
    ],
    scales: [
        {
            key: 'agreement',
            title: 'Agreement',
            intro: 'Please state your level of agreement for the following:',
            low: 'Strongly Disagree',
            high: 'Strongly Agree',
            items: [
                {
                    key: 'prompts_clear',
                    label: 'Prompts for inputs are clear',
                },
            ],
        },
        {
            key: 'ease',
            title: 'Ease of use',
            intro: 'How difficult are the following operations?',
            low: 'Very Difficult',
            high: 'Very Easy',
            items: [
                {
                    key: 'navigation_ease',
                    label: 'Navigation around the website',
                },
            ],
        },
    ],
};

void test('the steps follow the old form: feedback, each scale, then details', () => {
    assert.deepEqual(feedbackSteps(questions), [
        'Your feedback',
        'Agreement',
        'Ease of use',
        'Your details',
    ]);
});

void test('an error opens the step that asks it', () => {
    assert.equal(feedbackStepOf('type', questions), 1);
    assert.equal(feedbackStepOf('reading_ease', questions), 1);
    assert.equal(feedbackStepOf('prompts_clear', questions), 2);
    assert.equal(feedbackStepOf('navigation_ease', questions), 3);
    assert.equal(feedbackStepOf('email', questions), 4);
    assert.equal(feedbackStepOf('hei_id', questions), 4);
});

void test('only the type and the feedback hold back the first step', () => {
    assert.deepEqual(
        Object.keys(firstStepIssues({ type: '', feedback: '  ' })),
        ['type', 'feedback'],
    );
    assert.deepEqual(
        firstStepIssues({ type: 'bug', feedback: 'The export is empty.' }),
        {},
    );
});

void test("a new form starts blank, with the visitor's place when known", () => {
    const answers = emptyAnswers(questions, { region_id: '12', hei_id: '' });

    assert.equal(answers.region_id, '12');
    assert.equal(answers.reading_ease, '');
    assert.equal(answers.prompts_clear, '');
    assert.equal(answers.navigation_ease, '');
    assert.equal(answers.type, '');
});
