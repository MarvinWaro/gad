<?php

namespace App\Support;

/**
 * The website feedback form's rated questions, the one definition the public
 * form, the admin page, validation and the export all read. The wording is
 * the old PHLGADIS feedback form's, word for word ("PHLGADIS Version 2
 * Website Feedback", https://docs.google.com/forms/d/e/1FAIpQLSf6t7CVv7m_DwRX6ZyDxvdpGYxFon2ETS9Oy_iBmHadChFvvg/viewform).
 * Each key is a nullable score column on `site_feedback`; every question is
 * optional, as it was there.
 */
class FeedbackQuestions
{
    /**
     * The two choose-one questions on the form's first page, stored as the
     * chosen option's number (1 to 4, from hardest or least clear).
     *
     * @var array<string, array{label: string, options: array<int, string>}>
     */
    public const CHOICES = [
        'reading_ease' => [
            'label' => 'How difficult is reading characters on the screen?',
            'options' => [1 => 'Very Hard', 2 => 'Somewhat Hard', 3 => 'Somewhat Easy', 4 => 'Very Easy'],
        ],
        'information_clarity' => [
            'label' => 'What is your opinion about organization of information on the screen?',
            'options' => [1 => 'Very confusing', 2 => 'A little Confusing', 3 => 'A little Clear', 4 => 'Very clear'],
        ],
    ];

    /**
     * The 1-to-5 scales, a page each on the form, with the words at each end.
     * `title` names the step; it is this system's, not the old form's.
     *
     * @var array<string, array{title: string, intro: string, low: string, high: string, items: array<string, string>}>
     */
    public const SCALES = [
        'agreement' => [
            'title' => 'Agreement',
            'intro' => 'Please state your level of agreement for the following:',
            'low' => 'Strongly Disagree',
            'high' => 'Strongly Agree',
            'items' => [
                'terms_consistent' => 'Use of terms throughout the system is consistent',
                'messages_consistent' => 'Position of messages on the screen is consistent',
                'prompts_clear' => 'Prompts for inputs are clear',
                'progress_informed' => 'System always informs about the progress of the task',
                'aesthetically_pleasing' => 'The system is aesthetically pleasing',
            ],
        ],
        'ease' => [
            'title' => 'Ease of use',
            'intro' => 'How difficult are the following operations?',
            'low' => 'Very Difficult',
            'high' => 'Very Easy',
            'items' => [
                'navigation_ease' => 'Navigation around the website',
                'exploring_ease' => 'Exploring new features by trial and error',
                'user_friendliness' => 'User Friendliness of the system',
            ],
        ],
    ];

    /** The highest score on the 1-to-5 scales. */
    public const SCALE_MAX = 5;

    /**
     * Every score column with its highest value. The names are written here,
     * never taken from input, so queries may use them as they are.
     *
     * @return array<literal-string&non-falsy-string, int>
     */
    public static function columns(): array
    {
        $columns = array_map(fn (array $question): int => count($question['options']), self::CHOICES);

        foreach (self::SCALES as $scale) {
            $columns += array_fill_keys(array_keys($scale['items']), self::SCALE_MAX);
        }

        return $columns;
    }

    /** @return array<string, list<string>> */
    public static function rules(): array
    {
        return array_map(
            fn (int $max): array => ['nullable', 'integer', 'between:1,'.$max],
            self::columns(),
        );
    }

    /** A rated question's wording, by its column. */
    public static function label(string $column): string
    {
        if (isset(self::CHOICES[$column])) {
            return self::CHOICES[$column]['label'];
        }

        foreach (self::SCALES as $scale) {
            if (isset($scale['items'][$column])) {
                return $scale['items'][$column];
            }
        }

        return $column;
    }

    /** The answer as words: the option's label, or "4 of 5" on a scale. */
    public static function answerLabel(string $column, ?int $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return self::CHOICES[$column]['options'][$value] ?? sprintf('%d of %d', $value, self::SCALE_MAX);
    }

    /**
     * The questions as the pages show them.
     *
     * @return array{
     *     choices: list<array{key: string, label: string, options: list<array{value: int, label: string}>}>,
     *     scales: list<array{key: string, title: string, intro: string, low: string, high: string, items: list<array{key: string, label: string}>}>
     * }
     */
    public static function forForm(): array
    {
        $choices = [];
        foreach (self::CHOICES as $key => $question) {
            $options = [];
            foreach ($question['options'] as $value => $label) {
                $options[] = ['value' => $value, 'label' => $label];
            }
            $choices[] = ['key' => $key, 'label' => $question['label'], 'options' => $options];
        }

        $scales = [];
        foreach (self::SCALES as $key => $scale) {
            $items = [];
            foreach ($scale['items'] as $item => $label) {
                $items[] = ['key' => $item, 'label' => $label];
            }
            $scales[] = ['key' => $key, 'title' => $scale['title'], 'intro' => $scale['intro'], 'low' => $scale['low'], 'high' => $scale['high'], 'items' => $items];
        }

        return ['choices' => $choices, 'scales' => $scales];
    }
}
