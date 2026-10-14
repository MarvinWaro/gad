<?php

namespace App\Support;

use App\Http\Resources\PersonResource;
use App\Models\SurveyHei;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

/**
 * Finding people by name, as the header search and its results page do. The
 * one place the rule lives (docs/people-and-following.md).
 *
 * Names are compared through two keys the User model keeps beside the name:
 * `search_name`, the name without capitals, accents or punctuation, and
 * `search_sounds`, how each word sounds. So "PEÑA" finds Peña, "mar wa"
 * finds Marvin Waro, and "Marven" or "Jhon" find Marvin and John. Someone
 * whose institution's name holds the whole search matches too.
 *
 * Every word typed must match: the start of a word in the name, or, from
 * three letters, a word that sounds alike. The best matches come first:
 * the exact name, a name that starts with the search, every word matching
 * by its letters, by its sound, then by institution only; within each,
 * people the searcher follows, their own institution, their own region,
 * then by name.
 *
 * The keys are short and the matching is plain SQL, which stays quick for
 * tens of thousands of accounts. Past a few hundred thousand, put Laravel
 * Scout with Meilisearch behind query() instead; callers would not change.
 */
final class PeopleSearch
{
    /** Words of a search that are matched; the rest are ignored. */
    public const MAX_WORDS = 5;

    /** Shortest word matched by sound, so "jo" does not find every J. */
    public const SOUND_FROM = 3;

    /** The name as it is compared: lowercase ASCII words, single-spaced. */
    public static function normalize(string $text): string
    {
        $ascii = Str::lower(Str::ascii($text));

        return Str::squish((string) preg_replace('/[^a-z0-9]+/', ' ', $ascii));
    }

    /**
     * How each word sounds (metaphone). Silent H's are dropped, as in "Jhon"
     * or "Rhey", which Filipino names often carry.
     */
    public static function sound(string $word): string
    {
        return str_replace('H', '', metaphone($word));
    }

    /**
     * The keys a name is found by, stored on the account.
     *
     * @return array{search_name: string, search_sounds: string}
     */
    public static function keysFor(string $name): array
    {
        $normalized = self::normalize($name);
        $sounds = array_filter(array_map(self::sound(...), self::words($normalized)));

        return [
            'search_name' => Str::limit($normalized, 250, ''),
            'search_sounds' => Str::limit(implode(' ', $sounds), 250, ''),
        ];
    }

    /**
     * Active accounts matching the search, best first, ready for
     * PersonResource.
     *
     * @return Builder<User>
     */
    public static function query(User $viewer, string $search): Builder
    {
        $normalized = self::normalize($search);
        $words = array_slice(self::words($normalized), 0, self::MAX_WORDS);
        // An institution is matched on its own name, which the database
        // already compares without capitals.
        $institution = '%'.addcslashes(Str::squish($search), '%_\\').'%';

        [$byLetters, $letterBindings] = self::everyWord($words, sounds: false);
        [$byLettersOrSound, $soundBindings] = self::everyWord($words, sounds: true);
        $regionId = $viewer->regionId();

        return User::query()
            ->active()
            ->when(
                $words === [],
                fn (Builder $query) => $query->whereRaw('1 = 0'),
                fn (Builder $query) => $query->where(fn (Builder $match) => $match
                    ->whereRaw($byLettersOrSound, $soundBindings)
                    ->orWhereIn('survey_hei_id', SurveyHei::query()->select('id')->where('name', 'like', $institution))),
            )
            ->select(['id', 'ulid', 'name', 'avatar_path', 'survey_hei_id', 'survey_region_id', 'status'])
            ->with(['hei:id,name', 'officeRegion:id,name'])
            ->withExists(PersonResource::viewerFlags($viewer))
            ->orderByRaw(
                "case when search_name = ? then 0 when search_name like ? then 1 when {$byLetters} then 2 when {$byLettersOrSound} then 3 else 4 end",
                [$normalized, $normalized.'%', ...$letterBindings, ...$soundBindings],
            )
            ->orderByDesc('viewer_follows')
            ->when($viewer->survey_hei_id !== null, fn (Builder $query) => $query->orderByRaw(
                'case when survey_hei_id = ? then 0 else 1 end',
                [$viewer->survey_hei_id],
            ))
            ->when($regionId !== null, fn (Builder $query) => $query->orderByRaw(
                'case when survey_region_id = ? or survey_hei_id in ('.self::heisInRegionSql().') then 0 else 1 end',
                [$regionId, $regionId],
            ))
            ->orderBy('name')
            ->orderBy('id');
    }

    /** @return list<string> */
    private static function words(string $normalized): array
    {
        return $normalized === '' ? [] : explode(' ', $normalized);
    }

    /**
     * SQL that is true when every word starts a word of the name, or, with
     * `sounds`, sounds like one.
     *
     * @param  list<string>  $words
     * @return array{0: literal-string, 1: list<string>}
     */
    private static function everyWord(array $words, bool $sounds): array
    {
        $clauses = [];
        $bindings = [];

        foreach ($words as $word) {
            $options = ['search_name like ?', 'search_name like ?'];
            array_push($bindings, $word.'%', '% '.$word.'%');
            $sound = self::sound($word);

            if ($sounds && strlen($word) >= self::SOUND_FROM && $sound !== '') {
                array_push($options, 'search_sounds like ?', 'search_sounds like ?');
                array_push($bindings, $sound.'%', '% '.$sound.'%');
            }

            $clauses[] = '('.implode(' or ', $options).')';
        }

        return [$clauses === [] ? '1 = 0' : '('.implode(' and ', $clauses).')', $bindings];
    }

    /**
     * The institutions of one region, through their clusters; binds the region.
     *
     * @return literal-string
     */
    private static function heisInRegionSql(): string
    {
        return 'select survey_heis.id from survey_heis'
            .' inner join survey_clusters on survey_clusters.id = survey_heis.survey_cluster_id'
            .' where survey_clusters.survey_region_id = ?';
    }
}
