<?php

use App\Support\ParticipantCode;

test('a scanned or typed code is read the one way accounts hold it', function (string $text, string $code) {
    expect(ParticipantCode::parse($text))->toBe($code);
})->with([
    'as the QR holds it' => ['GAD-7K2M-Q9XA', 'GAD-7K2M-Q9XA'],
    'lowercase' => ['gad-7k2m-q9xa', 'GAD-7K2M-Q9XA'],
    'spaces around and inside' => ['  GAD 7K2M Q9XA ', 'GAD-7K2M-Q9XA'],
    'no dashes' => ['GAD7K2MQ9XA', 'GAD-7K2M-Q9XA'],
    'without the prefix' => ['7K2M-Q9XA', 'GAD-7K2M-Q9XA'],
    'O for zero, I and L for one' => ['GAD-7K2M-QOXI', 'GAD-7K2M-Q0X1'],
    'a code that itself begins with GAD' => ['GAD-GADX-1234', 'GAD-GADX-1234'],
    'those eight characters alone' => ['GADX1234', 'GAD-GADX-1234'],
]);

test('anything else is not a participant code', function (string $text) {
    expect(ParticipantCode::parse($text))->toBeNull();
})->with([
    'empty' => [''],
    'too short' => ['GAD-7K2M-Q9X'],
    'too long' => ['GAD-7K2M-Q9XAB'],
    'a U, which the alphabet leaves out' => ['GAD-7K2M-Q9XU'],
    'another system\'s prefix' => ['CHED-7K2M-Q9XA'],
    'a web address' => ['https://example.test/GAD-7K2M-Q9XA'],
    'punctuation' => ['GAD-7K2M-Q9X!'],
]);

test('every new code reads back as itself', function () {
    foreach (range(1, 50) as $attempt) {
        $code = ParticipantCode::generate();

        expect(ParticipantCode::parse($code))->toBe($code);
    }
});
