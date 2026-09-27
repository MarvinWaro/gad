<?php

use App\Support\InstitutionName;

test('directory names get readable casing that keeps acronyms', function (string $stored, string $shown) {
    expect(InstitutionName::display($stored))->toBe($shown);
})->with([
    ['NOTRE DAME OF MARBEL UNIVERSITY', 'Notre Dame of Marbel University'],
    ['ACLC COLLEGE OF MARBEL', 'ACLC College of Marbel'],
    ['AMA COMPUTER COLLEGE-GENERAL SANTOS CITY', 'AMA Computer College-General Santos City'],
    ['ANTONIO R. PACHECO COLLEGE, INC.', 'Antonio R. Pacheco College, Inc.'],
    ['B.E.S.T. COLLEGE OF POLOMOLOK, INC.', 'B.E.S.T. College of Polomolok, Inc.'],
    ['BROKENSHIRE COLLEGE SOCSKSARGEN, INC.', 'Brokenshire College SOCSKSARGEN, Inc.'],
    ['DE LA VIDA COLLEGE, INC.', 'De La Vida College, Inc.'],
    ['DR. DOMINGO B. TAMONDONG MEMORIAL HOSPITAL & COLLEGE FOUNDATION, INC.', 'Dr. Domingo B. Tamondong Memorial Hospital & College Foundation, Inc.'],
    ['GENERAL SANTOS DOCTORS\' MEDICAL SCHOOL FOUNDATION, INC.', 'General Santos Doctors\' Medical School Foundation, Inc.'],
    ['KING\'S COLLEGE OF ISULAN', 'King\'s College of Isulan'],
    ['SOUTHPOINT COLLEGE OF ARTS AND TECHNOLOGY (SPAT), INC.', 'Southpoint College of Arts and Technology (SPAT), Inc.'],
    ['STI COLLEGE - GEN. SANTOS , INC', 'STI College - Gen. Santos , Inc'],
    ['UPM-SCHOOL OF HEALTH SCIENCES KORONADAL CAMPUS', 'UPM-School of Health Sciences Koronadal Campus'],
    ['MARBEL SCHOOL OF SCIENCE AND TECHNOLOGY,INC.', 'Marbel School of Science and Technology,Inc.'],
    ['ACADEMIA DE TECHNOLOGIA IN MINDANAO', 'Academia de Technologia in Mindanao'],
    ['SCHOLA DE SAN JOSE, INC.', 'Schola de San Jose, Inc.'],
    ['ST. LUKE\'S INSTITUTE', 'St. Luke\'s Institute'],
    ['NEW ERA UNIVERSITY, GENERAL SANTOS CITY BRANCH', 'New Era University, General Santos City Branch'],
    ['NOTRE DAME-RVM COLLEGE OF COTABATO', 'Notre Dame-RVM College of Cotabato'],
    ['KING SOLOMON INSTITUTE, INC.', 'King Solomon Institute, Inc.'],
    ['INTERNATIONAL CRUISE SHIP COLLEGE', 'International Cruise Ship College'],
    ['SULTAN KUDARAT STATE UNIVERSITY-SNA', 'Sultan Kudarat State University-SNA'],
]);

test('names that already use mixed case are left alone', function () {
    expect(InstitutionName::display('Ateneo de Davao University'))->toBe('Ateneo de Davao University');
});
