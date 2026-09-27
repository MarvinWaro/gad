import assert from 'node:assert/strict';
import { test } from 'node:test';
import { glossary } from '../../resources/js/data/definition-of-terms.ts';
import { laws, resources } from '../../resources/js/data/phlgadis-demo.ts';
import {
    filterGlossary,
    highlightParts,
    tokenize,
} from '../../resources/js/lib/glossary.ts';

const terms = glossary.flatMap((group) => group.terms);
const count = (groups: ReturnType<typeof filterGlossary>) =>
    groups.reduce((sum, group) => sum + group.terms.length, 0);

void test('the glossary carries all 19 terms under known laws with unique slugs', () => {
    assert.equal(terms.length, 19);
    assert.equal(new Set(terms.map((term) => term.slug)).size, 19);
    const lawSlugs = new Set(laws.map((law) => law.slug));
    for (const group of glossary) assert.ok(lawSlugs.has(group.law));
    // Group ids and term ids share one page, so they must not collide.
    for (const term of terms) assert.ok(!lawSlugs.has(term.slug));
});

void test('every form points at a term on the page', () => {
    const slugs = new Set(terms.map((term) => term.slug));
    const forms = terms.filter((term) => term.partOf);
    assert.equal(forms.length, 4);
    for (const form of forms) assert.ok(slugs.has(form.partOf!));
});

void test('the homepage card summary matches the glossary', () => {
    const card = resources.find((resource) => resource.id === 'terms');
    assert.equal(card?.summary, `${terms.length} terms`);
});

void test('every word of a search must match, ignoring case and accents', () => {
    assert.equal(count(filterGlossary(glossary, tokenize(''))), 19);
    assert.equal(count(filterGlossary(glossary, tokenize('  '))), 19);

    const stalking = filterGlossary(glossary, tokenize('STALKING'));
    assert.deepEqual(
        stalking.flatMap((group) => group.terms.map((term) => term.slug)),
        ['psychological-violence', 'stalking'],
    );
    // Groups stay in place, empty, so each law can show its count.
    assert.equal(stalking.length, glossary.length);

    assert.equal(count(filterGlossary(glossary, tokenize('gënder équity'))), 1);
    assert.equal(
        count(filterGlossary(glossary, tokenize('stalking gender'))),
        0,
    );
    // Sub-items are searched too.
    assert.deepEqual(
        filterGlossary(glossary, tokenize('household'))
            .flatMap((group) => group.terms)
            .map((term) => term.slug),
        ['economic-abuse'],
    );
    // A typographic apostrophe (as phones type it) finds a straight one.
    assert.equal(count(filterGlossary(glossary, tokenize('victim’s body'))), 1);
});

void test('highlighting marks every match and keeps the original text', () => {
    const text = 'Gender Equality refers to gender, and Gënder.';
    const parts = highlightParts(text, tokenize('gender'));
    assert.equal(parts.map((part) => part.text).join(''), text);
    assert.deepEqual(
        parts.filter((part) => part.match).map((part) => part.text),
        ['Gender', 'gender', 'Gënder'],
    );

    assert.deepEqual(highlightParts(text, []), [{ text, match: false }]);
    // Overlapping tokens merge into one mark.
    assert.deepEqual(
        highlightParts('catcalling', tokenize('cat call'))
            .filter((part) => part.match)
            .map((part) => part.text),
        ['catcall'],
    );
});
