<?php

use App\Models\MonitoringAnswer;
use App\Models\MonitoringReport;
use App\Models\MonitoringRevision;
use App\Support\MonitoringDocument;

/** A report and revision in memory, as finalizing sees them. */
function documentFixture(string $codi = 'CODI constituted'): array
{
    $report = new MonitoringReport([
        'institution_name' => 'Fictional HEI',
        'academic_year' => '2026-2027',
        'semester' => 1,
    ]);
    $report->id = '01k0000000000000000000test';

    $revision = new MonitoringRevision([
        'number' => 1,
        'template_version' => '2025',
        'address' => 'Campus road',
        'accomplished_on' => '2026-09-29',
        'president_name' => 'Example President',
    ]);
    $revision->setRelation('answers', collect([
        new MonitoringAnswer(['requirement_key' => 'codi', 'answer' => $codi]),
        new MonitoringAnswer(['requirement_key' => 'gfps-membership', 'answer' => 'Chair and members']),
    ]));

    return [$report, $revision];
}

test('the document code is the start of the content hash', function () {
    expect(MonitoringDocument::code('7f3a91c2'.str_repeat('0', 56)))->toBe('7F3A-91C2');
});

test('the content hash is stable and follows every signed detail', function () {
    [$report, $revision] = documentFixture();
    $hash = MonitoringDocument::contentHash($report, $revision);

    // A fixed vector: changing what is hashed would change the code of every
    // report already signed, so it must not change by accident.
    expect($hash)->toBe('d26b7a6d8da209eef1882e140418433aee2b2f424d7cb7e389ce9342835a01ba')
        ->and(MonitoringDocument::contentHash(...documentFixture('CODI constituted.')))->not->toBe($hash);

    $revision->number = 2;
    expect(MonitoringDocument::contentHash($report, $revision))->not->toBe($hash);
});
