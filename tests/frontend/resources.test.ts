import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { test } from 'node:test';
import { issuances } from '../../resources/js/data/issuances.ts';
import { manuals } from '../../resources/js/data/manuals.ts';
import { laws, resources } from '../../resources/js/data/phlgadis-demo.ts';
import { formatFileSize } from '../../resources/js/lib/file-size.ts';

const publicFile = (path: string) =>
    statSync(new URL(`../../public${path}`, import.meta.url)).size;

void test('resource card summaries match what their pages list', () => {
    const summary = (id: string) =>
        resources.find((resource) => resource.id === id)?.summary;
    assert.equal(summary('acts'), `${laws.length} laws`);
    assert.equal(summary('issuances'), `${issuances.length} issuances`);
    assert.equal(summary('manuals'), `${manuals.length} manuals`);
});

void test('every Act carries its list name, short title and a real approval date', () => {
    for (const law of laws) {
        assert.ok(law.listName);
        assert.ok(law.shortTitle);
        assert.match(law.approved, /^\d{4}-\d{2}-\d{2}$/);
        assert.equal(
            new Date(law.approved).toISOString().slice(0, 10),
            law.approved,
        );
        // A year in the short title is the year the Act was approved.
        const year = law.shortTitle.match(/\d{4}/)?.[0];
        if (year) assert.ok(law.approved.startsWith(year), law.number);
    }
});

void test('recorded file sizes match the files in public/', () => {
    for (const law of laws) {
        if (law.document.endsWith('.pdf')) {
            assert.equal(law.documentBytes, publicFile(law.document));
        }
        if (law.brochure) {
            assert.equal(law.brochure.bytes, publicFile(law.brochure.href));
        }
    }
    for (const record of [...issuances, ...manuals]) {
        assert.equal(record.documentBytes, publicFile(record.document));
    }
});

void test('issuances and manuals name only known laws and valid dates', () => {
    const slugs = new Set(laws.map((law) => law.slug));
    const isDate = (date: string) =>
        new Date(date).toISOString().slice(0, 10) === date;
    for (const record of [...issuances, ...manuals]) {
        assert.ok(record.relatedLaws.length > 0, record.title);
        for (const slug of record.relatedLaws) assert.ok(slugs.has(slug));
    }
    for (const issuance of issuances) {
        if (issuance.issued) assert.ok(isDate(issuance.issued));
    }
    for (const manual of manuals) {
        if (manual.administered) assert.ok(isDate(manual.administered));
    }
});

void test('file sizes read the way browsers and file managers show them', () => {
    assert.equal(formatFileSize(512), '512 byte');
    assert.equal(formatFileSize(121190), '121 kB');
    assert.equal(formatFileSize(6658694), '6.7 MB');
    assert.equal(formatFileSize(12829367), '12.8 MB');
    assert.equal(formatFileSize(5978152), '6 MB');
});
