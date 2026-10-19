<x-mail::layout>
{{-- Header --}}
<x-slot:header>
<x-mail::header :url="config('app.url')" />
</x-slot:header>

{{-- Body --}}
{!! $slot !!}

{{-- Subcopy --}}
@isset($subcopy)
<x-slot:subcopy>
<x-mail::subcopy>
{!! $subcopy !!}
</x-mail::subcopy>
</x-slot:subcopy>
@endisset

{{-- Footer: the partner seals, then who sends it --}}
<x-slot:footer>
<tr>
<td>
<table class="footer" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td class="content-cell" align="center">
<img src="{{ asset('assets/img/email/ched-seal.png') }}" class="seal" width="40" height="40" alt="Commission on Higher Education">
<img src="{{ asset('assets/img/email/bagong-pilipinas.png') }}" class="seal" width="40" height="40" alt="Bagong Pilipinas">
<p>Commission on Higher Education<br>Philippine Higher Education Gender and Development Information System</p>
<p>This email was sent by <a href="{{ config('app.url') }}">{{ config('app.name') }}</a>. Please don't reply to it.</p>
</td>
</tr>
</table>
</td>
</tr>
</x-slot:footer>
</x-mail::layout>
