<?php

use App\Support\CertificateNumber;

test('a typed certificate number is read the one way certificates hold it', function (string $text, string $number) {
    expect(CertificateNumber::parse($text))->toBe($number);
})->with([
    'as printed' => ['CERT-7K2M-Q9XA', 'CERT-7K2M-Q9XA'],
    'lowercase' => ['cert-7k2m-q9xa', 'CERT-7K2M-Q9XA'],
    'spaces around and inside' => ['  CERT 7K2M Q9XA ', 'CERT-7K2M-Q9XA'],
    'no dashes' => ['CERT7K2MQ9XA', 'CERT-7K2M-Q9XA'],
    'without the prefix' => ['7K2M-Q9XA', 'CERT-7K2M-Q9XA'],
    'O for zero, I and L for one' => ['CERT-7K2M-QOXL', 'CERT-7K2M-Q0X1'],
]);

test('anything else is not a certificate number', function (string $text) {
    expect(CertificateNumber::parse($text))->toBeNull();
})->with([
    'empty' => [''],
    'too short' => ['CERT-7K2M-Q9X'],
    'too long' => ['CERT-7K2M-Q9XAB'],
    'a U, which the alphabet leaves out' => ['CERT-7K2M-Q9XU'],
    'a participant code' => ['GAD-7K2M-Q9XA'],
    'punctuation' => ['CERT-7K2M-Q9X!'],
]);

test('every new number reads back as itself', function () {
    foreach (range(1, 50) as $attempt) {
        $number = CertificateNumber::generate();

        expect($number)->toMatch('/^CERT-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/')
            ->and(CertificateNumber::parse($number))->toBe($number);
    }
});
