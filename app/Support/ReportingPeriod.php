<?php

namespace App\Support;

use App\Models\GadEvent;
use Carbon\CarbonImmutable;

/**
 * The stretch of time the dashboard reports on: a whole academic year, one of
 * its semesters, or one month, in Philippine time. Academic years follow
 * AcademicPeriod: August to July, the first semester August to December and
 * the second January to July.
 */
final class ReportingPeriod
{
    public const VIEWS = ['year', 'semester', 'month'];

    private function __construct(
        public readonly string $academicYear,
        public readonly string $view,
        public readonly ?int $semester,
        public readonly ?int $month,
        /** The first day, at midnight in Philippine time. */
        public readonly CarbonImmutable $startsOn,
        /** The last day, at midnight in Philippine time. */
        public readonly CarbonImmutable $endsOn,
    ) {}

    /**
     * The period the filters ask for. Without them it is the current
     * academic year; a semester or month view without its choice takes the
     * current one when it falls in that year.
     *
     * @param  array<string, mixed>  $filters
     */
    public static function fromFilters(array $filters, ?CarbonImmutable $today = null): self
    {
        $today ??= CarbonImmutable::now(GadEvent::TIMEZONE);
        $current = AcademicPeriod::current($today);
        $academicYear = is_string($filters['academic_year'] ?? null) ? $filters['academic_year'] : $current['academic_year'];
        $view = in_array($filters['view'] ?? null, self::VIEWS, true) ? $filters['view'] : 'year';
        $isCurrentYear = $academicYear === $current['academic_year'];

        return match ($view) {
            'semester' => self::semester($academicYear, (int) ($filters['semester'] ?? ($isCurrentYear ? $current['semester'] : 1))),
            'month' => self::month($academicYear, (int) ($filters['month'] ?? ($isCurrentYear ? $today->month : 8))),
            default => self::year($academicYear),
        };
    }

    public static function year(string $academicYear): self
    {
        $start = self::firstOf(self::startYear($academicYear), 8);

        return new self($academicYear, 'year', null, null, $start, $start->addYear()->subDay());
    }

    public static function semester(string $academicYear, int $semester): self
    {
        $semester = $semester === 2 ? 2 : 1;
        $start = $semester === 1
            ? self::firstOf(self::startYear($academicYear), 8)
            : self::firstOf(self::startYear($academicYear) + 1, 1);

        return new self($academicYear, 'semester', $semester, null, $start, $start->addMonths($semester === 1 ? 5 : 7)->subDay());
    }

    public static function month(string $academicYear, int $month): self
    {
        $month = max(1, min(12, $month));
        $start = self::firstOf(self::startYear($academicYear) + ($month >= 8 ? 0 : 1), $month);

        return new self($academicYear, 'month', null, $month, $start, $start->endOfMonth()->startOfDay());
    }

    /** The period just before this one, of the same length. */
    public function previous(): self
    {
        $previousYear = AcademicPeriod::label(self::startYear($this->academicYear) - 1);

        return match ($this->view) {
            'semester' => $this->semester === 1
                ? self::semester($previousYear, 2)
                : self::semester($this->academicYear, 1),
            'month' => $this->month === 8
                ? self::month($previousYear, 7)
                : self::month($this->academicYear, $this->month === 1 ? 12 : (int) $this->month - 1),
            default => self::year($previousYear),
        };
    }

    public function label(): string
    {
        return match ($this->view) {
            'semester' => ($this->semester === 1 ? '1st' : '2nd').' semester, AY '.$this->academicYear,
            'month' => $this->startsOn->format('F Y'),
            default => 'AY '.$this->academicYear,
        };
    }

    /** Such as "Aug 1, 2026 – Jul 31, 2027" or "Sep 1–30, 2026". */
    public function range(): string
    {
        if ($this->view === 'month') {
            return $this->startsOn->format('M j').'–'.$this->endsOn->format('j, Y');
        }

        return $this->startsOn->format('M j, Y').' – '.$this->endsOn->format('M j, Y');
    }

    /** What a change is measured against, such as "vs. August". */
    public function comparison(): string
    {
        $previous = $this->previous();

        return 'vs. '.match ($this->view) {
            'semester' => ($previous->semester === 1 ? '1st' : '2nd').' semester'
                .($previous->academicYear === $this->academicYear ? '' : ' '.$previous->academicYear),
            'month' => $previous->startsOn->format('F'),
            default => 'AY '.$previous->academicYear,
        };
    }

    /**
     * The start (inclusive) and end (exclusive) as UTC instants, for
     * timestamps stored in UTC.
     *
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    public function utcBounds(): array
    {
        return [$this->startsOn->utc(), $this->endsOn->addDay()->utc()];
    }

    /**
     * The chart's points: months for a year or semester, five-day spans for
     * a month (the last one runs to the month's end).
     *
     * @return list<array{label: string, title: string, starts_on: string, ends_on: string}>
     */
    public function buckets(): array
    {
        $buckets = [];

        if ($this->view === 'month') {
            for ($day = 1; $day <= $this->endsOn->day; $day += 5) {
                $start = $this->startsOn->setDay($day);
                $end = $day + 9 > $this->endsOn->day ? $this->endsOn : $start->addDays(4);
                $label = $start->format('M j').'–'.$end->format('j');
                $buckets[] = ['label' => $label, 'title' => $label.', '.$start->format('Y'), 'starts_on' => $start->toDateString(), 'ends_on' => $end->toDateString()];

                if ($end->equalTo($this->endsOn)) {
                    break;
                }
            }

            return $buckets;
        }

        for ($month = $this->startsOn; $month->lessThanOrEqualTo($this->endsOn); $month = $month->addMonth()) {
            $buckets[] = [
                'label' => $month->format('M'),
                'title' => $month->format('F Y'),
                'starts_on' => $month->toDateString(),
                'ends_on' => $month->endOfMonth()->toDateString(),
            ];
        }

        return $buckets;
    }

    /** @return array{academic_year: string, view: string, semester: int|null, month: int|null, label: string, range: string, comparison: string} */
    public function toArray(): array
    {
        return [
            'academic_year' => $this->academicYear,
            'view' => $this->view,
            'semester' => $this->semester,
            'month' => $this->month,
            'label' => $this->label(),
            'range' => $this->range(),
            'comparison' => $this->comparison(),
        ];
    }

    private static function startYear(string $academicYear): int
    {
        return (int) substr($academicYear, 0, 4);
    }

    private static function firstOf(int $year, int $month): CarbonImmutable
    {
        return CarbonImmutable::create($year, $month, 1, 0, 0, 0, GadEvent::TIMEZONE);
    }
}
