<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The survey builder lets an editor mark a question as not required, but these
 * columns were NOT NULL, so the public form had to demand an answer whatever
 * the questionnaire said. Allow the answers to be absent so the Required
 * toggle means what it says; the foreign keys and their restrict-on-delete
 * behaviour are unchanged for answers that are given.
 */
return new class extends Migration
{
    /** @var list<string> */
    private array $foreignKeys = [
        'survey_region_id' => 'survey_regions',
        'survey_cluster_id' => 'survey_clusters',
        'survey_hei_id' => 'survey_heis',
    ];

    public function up(): void
    {
        $rebuilds = Schema::getConnection()->getDriverName() === 'sqlite';

        if (! $rebuilds) {
            Schema::table('survey_responses', function (Blueprint $table) {
                foreach (array_keys($this->foreignKeys) as $column) {
                    $table->dropForeign([$column]);
                }
            });
        }

        Schema::table('survey_responses', function (Blueprint $table) {
            $table->unsignedTinyInteger('age')->nullable()->change();
            $table->string('sex', 40)->nullable()->change();
            $table->string('respondent_group', 60)->nullable()->change();
            foreach (array_keys($this->foreignKeys) as $column) {
                $table->unsignedBigInteger($column)->nullable()->change();
            }
        });

        if (! $rebuilds) {
            Schema::table('survey_responses', function (Blueprint $table) {
                foreach ($this->foreignKeys as $column => $referenced) {
                    $table->foreign($column)->references('id')->on($referenced)->restrictOnDelete();
                }
            });
        }
    }

    public function down(): void
    {
        $rebuilds = Schema::getConnection()->getDriverName() === 'sqlite';

        if (! $rebuilds) {
            Schema::table('survey_responses', function (Blueprint $table) {
                foreach (array_keys($this->foreignKeys) as $column) {
                    $table->dropForeign([$column]);
                }
            });
        }

        Schema::table('survey_responses', function (Blueprint $table) {
            $table->unsignedTinyInteger('age')->nullable(false)->change();
            $table->string('sex', 40)->nullable(false)->change();
            $table->string('respondent_group', 60)->nullable(false)->change();
            foreach (array_keys($this->foreignKeys) as $column) {
                $table->unsignedBigInteger($column)->nullable(false)->change();
            }
        });

        if (! $rebuilds) {
            Schema::table('survey_responses', function (Blueprint $table) {
                foreach ($this->foreignKeys as $column => $referenced) {
                    $table->foreign($column)->references('id')->on($referenced)->restrictOnDelete();
                }
            });
        }
    }
};
