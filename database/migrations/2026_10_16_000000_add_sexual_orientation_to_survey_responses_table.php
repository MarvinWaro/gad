<?php

use App\Models\SurveyAnswerTally;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const NO_EMAIL = 'No name or email is collected.';

    private const OPTIONAL_EMAIL = 'No name is collected, and giving an email is optional.';

    /**
     * Respondent details, reworked (App\Support\RespondentDetails):
     *
     * - Sexual orientation becomes its own optional question.
     * - Gender identity offers one list whatever the sex answer, so the
     *   identity "Heterosexual" (an orientation) becomes Cisgender Man or
     *   Woman by the sex given with it, and "Gender Variant" becomes
     *   Non-binary / Gender Diverse. Answers already kept, and their
     *   tallies, move with them.
     * - An optional email, encrypted, which the live surveys' notices now
     *   mention instead of promising none is collected.
     */
    public function up(): void
    {
        Schema::table('survey_responses', function (Blueprint $table) {
            $table->string('sexual_orientation', 40)->nullable()->after('gender_identity')->index();
            // Text, because the encrypted value is far longer than the address.
            $table->text('email')->nullable()->after('sexual_orientation');
        });

        foreach (['male' => 'cisgender-man', 'female' => 'cisgender-woman'] as $sex => $cisgender) {
            $this->moveGenderIdentity('heterosexual', $cisgender, $sex);
        }
        // Any other sex answer with "Heterosexual" says nothing about gender.
        $this->moveGenderIdentity('heterosexual', 'prefer-not-to-say', 'other');
        $this->moveGenderIdentity('gender-variant', 'non-binary');

        $this->replaceInNotices(self::NO_EMAIL, self::OPTIONAL_EMAIL);
    }

    /** As near the old answers as they go; "Another" had no old equivalent. */
    public function down(): void
    {
        $this->replaceInNotices(self::OPTIONAL_EMAIL, self::NO_EMAIL);
        $this->moveGenderIdentity('non-binary', 'gender-variant');
        $this->moveGenderIdentity('cisgender-man', 'heterosexual');
        $this->moveGenderIdentity('cisgender-woman', 'heterosexual');

        DB::table('survey_answer_tallies')->where('question', 'sexual_orientation')->delete();

        Schema::table('survey_responses', function (Blueprint $table) {
            $table->dropIndex(['sexual_orientation']);
            $table->dropColumn(['sexual_orientation', 'email']);
        });
    }

    /**
     * Moves one gender identity code to another, in the responses and in
     * their tallies: for every sex answer, for one (`male`, `female`), or for
     * any `other` answer than those two.
     */
    private function moveGenderIdentity(string $from, string $to, ?string $sex = null): void
    {
        $narrow = fn ($query) => match ($sex) {
            null => $query,
            'other' => $query->where(fn ($query) => $query->whereNull('sex')->orWhereNotIn('sex', ['male', 'female'])),
            default => $query->where('sex', $sex),
        };

        $narrow(DB::table('survey_responses')->where('gender_identity', $from))->update(['gender_identity' => $to]);

        // A tally's key hashes its answer, so each moved row gets a new one,
        // or adds to the row that already holds the new answer.
        $narrow(DB::table('survey_answer_tallies')->where('question', 'gender_identity')->where('answer', $from))
            ->orderBy('id')
            ->get()
            ->each(function (stdClass $tally) use ($to): void {
                $key = SurveyAnswerTally::keyFor([
                    'date' => substr((string) $tally->date, 0, 10),
                    'survey_id' => (int) $tally->survey_id,
                    'survey_region_id' => $tally->survey_region_id === null ? null : (int) $tally->survey_region_id,
                    'survey_hei_id' => $tally->survey_hei_id === null ? null : (int) $tally->survey_hei_id,
                    'respondent_group' => $tally->respondent_group,
                    'sex' => $tally->sex,
                    'question' => 'gender_identity',
                    'answer' => $to,
                    'detail' => $tally->detail,
                ]);

                if (DB::table('survey_answer_tallies')->where('key', $key)->exists()) {
                    DB::table('survey_answer_tallies')->where('key', $key)->increment('responses', (int) $tally->responses);
                    DB::table('survey_answer_tallies')->where('id', $tally->id)->delete();

                    return;
                }

                DB::table('survey_answer_tallies')->where('id', $tally->id)->update(['answer' => $to, 'key' => $key]);
            });
    }

    /** The live and draft versions' notices; superseded ones stay as answered. */
    private function replaceInNotices(string $from, string $to): void
    {
        DB::table('survey_versions')
            ->whereIn('status', ['draft', 'published'])
            ->orderBy('id')
            ->get(['id', 'introduction', 'privacy_notice'])
            ->each(function (stdClass $version) use ($from, $to): void {
                $changes = array_filter([
                    'introduction' => str_replace($from, $to, (string) $version->introduction),
                    'privacy_notice' => str_replace($from, $to, (string) $version->privacy_notice),
                ], fn (string $text, string $column): bool => $text !== (string) $version->{$column}, ARRAY_FILTER_USE_BOTH);

                if ($changes !== []) {
                    DB::table('survey_versions')->where('id', $version->id)->update($changes);
                }
            });
    }
};
