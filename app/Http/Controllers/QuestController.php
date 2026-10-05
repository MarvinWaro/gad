<?php

namespace App\Http\Controllers;

use App\Actions\Quests\PlayQuest;
use App\Http\Requests\Quests\AnswerQuestRequest;
use App\Models\Quest;
use App\Models\User;
use App\Support\Achievements;
use App\Support\QuestPlayState;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * GAD Quest for its players: the quests open to them, their badges, and the
 * game itself (docs/gad-quest.md).
 */
class QuestController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        return Inertia::render('quests/index', [
            'quests' => QuestPlayState::page($user),
            'achievements' => Achievements::quests($user),
            'canManage' => $user->can('manage', Quest::class),
        ]);
    }

    public function show(Request $request, Quest $quest): Response
    {
        /** @var User $user */
        $user = $request->user();

        return Inertia::render('quests/play', [
            ...QuestPlayState::for($quest, $user),
            'canManage' => $user->can('manage', Quest::class),
        ]);
    }

    public function start(Request $request, Quest $quest, PlayQuest $play): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $play->start($quest, $user);

        return to_route('quests.show', $quest);
    }

    public function answer(AnswerQuestRequest $request, Quest $quest, PlayQuest $play): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $play->answer($quest, $user, (int) $request->validated('question'), (string) $request->validated('choice'));

        return to_route('quests.show', $quest);
    }
}
