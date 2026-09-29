<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Monitoring report · {{ $report->academic_year }} · Revision {{ $revision->number }}</title>
    <style>
        :root { color-scheme: light; }
        body { margin: 0; background: white; color: black; font: 12pt/1.5 Arial, sans-serif; }
        main { max-width: 190mm; margin: 24px auto; padding: 20px; }
        h1 { font-size: 17pt; margin-bottom: 8px; }
        header { text-align: center; }
        .toolbar { background: #faf8f5; padding: 16px; text-align: center; }
        button { font: inherit; padding: 10px 20px; cursor: pointer; }
        dl { margin: 24px 0; } dt { font-weight: bold; } dd { margin: 0 0 12px; white-space: pre-wrap; overflow-wrap: anywhere; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        th, td { border: 1px solid black; padding: 10px; vertical-align: top; text-align: left; overflow-wrap: anywhere; }
        th:first-child { width: 40%; } .answer, .detail { white-space: pre-wrap; }
        .detail { font-weight: normal; }
        .section { font-weight: bold; background: #faf8f5; }
        .legacy-note { margin-top: 24px; padding: 12px; border: 1px solid black; white-space: pre-wrap; overflow-wrap: anywhere; }
        .signatures { display: flex; gap: 40px; margin-top: 70px; break-inside: avoid; }
        .signatures div { flex: 1; text-align: center; border-top: 1px solid black; padding-top: 8px; }
        .reference { font-size: 9pt; margin-top: 24px; overflow-wrap: anywhere; }
        @media (max-width: 600px) { main { padding: 12px; } th, td { padding: 6px; } }
        @page { size: A4; margin: 15mm; }
        @media print { .toolbar { display: none; } main { max-width: none; margin: 0; padding: 0; } thead { display: table-header-group; } tr { break-inside: auto; } .section { break-after: avoid; } }
    </style>
</head>
<body>
<div class="toolbar"><button type="button" onclick="window.print()">Print / Save PDF</button><p>Print for signatures, or choose Save as PDF in your browser’s print dialog.</p></div>
<main>
    <header><h1>{{ $template['title'] }}</h1><p>{{ $template['subtitle'] }}</p></header>
    <dl>
        <dt>Name of HEI:</dt><dd>{{ $revision->institution_snapshot['name'] ?? $report->institution_name }}</dd>
        <dt>Address:</dt><dd>{{ $revision->address }}</dd>
        <dt>Date Accomplished:</dt><dd>{{ $revision->accomplished_on?->format('F j, Y') }}</dd>
        <dt>Reporting period:</dt><dd>{{ $report->academic_year }} · {{ $report->semester === 1 ? 'First' : 'Second' }} Semester · Revision {{ $revision->number }}</dd>
    </dl>
    <table>
        <thead><tr><th scope="col">REQUIREMENTS</th><th scope="col">STATUS OF COMPLIANCE<br>Please state actual situations per item.</th></tr></thead>
        <tbody>
        @foreach ($template['sections'] as $section)
            @if ($revision->template_version !== \App\Support\MonitoringTemplate::LEGACY_VERSION)
                @if ($section['standalone'])
                    @php($item = $section['items'][0])
                    <tr><th scope="row">{{ $section['number'] }}) {{ $section['title'] }}@if (!empty($item['detail']))<div class="detail">{{ $item['detail'] }}</div>@endif</th><td class="answer">{{ $answers[$item['key']] ?? '' }}</td></tr>
                @else
                    <tr class="section"><th scope="rowgroup">{{ $section['number'] . ') ' . $section['title'] }}</th><td></td></tr>
                    @foreach ($section['items'] as $item)
                        <tr><td>{{ chr(97 + $loop->index) }}. {{ $item['label'] }}@if (!empty($item['detail']))<div class="detail">{{ $item['detail'] }}</div>@endif</td><td class="answer">{{ $answers[$item['key']] ?? '' }}</td></tr>
                    @endforeach
                @endif
            @else
                <tr class="section"><th colspan="2" scope="rowgroup">{{ $section['title'] }}</th></tr>
                @foreach ($section['items'] as $item)
                    <tr><td>{{ $item['label'] }}@if (!empty($item['detail']))<div class="detail">{{ $item['detail'] }}</div>@endif</td><td class="answer">{{ $answers[$item['key']] ?? '' }}</td></tr>
                @endforeach
            @endif
        @endforeach
        </tbody>
    </table>
    @if ($revision->template_version !== \App\Support\MonitoringTemplate::LEGACY_VERSION && !empty($answers['gfps-establishment']))
        <div class="legacy-note"><strong>Earlier GFPS overview answer (preserved from the previous form)</strong><br>{{ $answers['gfps-establishment'] }}</div>
    @endif
    @if ($revision->template_version === \App\Support\MonitoringTemplate::VERSION && !empty($answers['opportunity']))
        <div class="legacy-note"><strong>Earlier Equal Opportunity answer (preserved from the previous form)</strong><br>{{ $answers['opportunity'] }}</div>
    @endif
    <div class="signatures"><div>{{ $revision->president_name }}<br>President<br>(Name and signature)</div><div>{{ $revision->focal_person_name }}<br>GAD Focal Person<br>(Name and signature)</div></div>
    <p class="reference">Report {{ $report->id }} · Revision {{ $revision->number }} · Template {{ $revision->template_version }}</p>
</main>
</body>
</html>
