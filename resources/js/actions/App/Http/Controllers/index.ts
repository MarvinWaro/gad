import Api from './Api'
import SiteRatingController from './SiteRatingController'
import SiteFeedbackController from './SiteFeedbackController'
import PublicSurveyController from './PublicSurveyController'
import DashboardController from './DashboardController'
import EventController from './EventController'
import MyProfileController from './MyProfileController'
import PersonProfileController from './PersonProfileController'
import FollowController from './FollowController'
import PeopleSearchController from './PeopleSearchController'
import NotificationController from './NotificationController'
import PostController from './PostController'
import PostTagSuggestionController from './PostTagSuggestionController'
import NewerPostsController from './NewerPostsController'
import PostShareController from './PostShareController'
import PostHomepageController from './PostHomepageController'
import PostReactionController from './PostReactionController'
import PostCommentController from './PostCommentController'
import CommunityController from './CommunityController'
import Admin from './Admin'
import Settings from './Settings'
import MonitoringController from './MonitoringController'
import ChecklistController from './ChecklistController'
import ManageQuestController from './ManageQuestController'
import QuestController from './QuestController'
const Controllers = {
    Api: Object.assign(Api, Api),
SiteRatingController: Object.assign(SiteRatingController, SiteRatingController),
SiteFeedbackController: Object.assign(SiteFeedbackController, SiteFeedbackController),
PublicSurveyController: Object.assign(PublicSurveyController, PublicSurveyController),
DashboardController: Object.assign(DashboardController, DashboardController),
EventController: Object.assign(EventController, EventController),
MyProfileController: Object.assign(MyProfileController, MyProfileController),
PersonProfileController: Object.assign(PersonProfileController, PersonProfileController),
FollowController: Object.assign(FollowController, FollowController),
PeopleSearchController: Object.assign(PeopleSearchController, PeopleSearchController),
NotificationController: Object.assign(NotificationController, NotificationController),
PostController: Object.assign(PostController, PostController),
PostTagSuggestionController: Object.assign(PostTagSuggestionController, PostTagSuggestionController),
NewerPostsController: Object.assign(NewerPostsController, NewerPostsController),
PostShareController: Object.assign(PostShareController, PostShareController),
PostHomepageController: Object.assign(PostHomepageController, PostHomepageController),
PostReactionController: Object.assign(PostReactionController, PostReactionController),
PostCommentController: Object.assign(PostCommentController, PostCommentController),
CommunityController: Object.assign(CommunityController, CommunityController),
Admin: Object.assign(Admin, Admin),
Settings: Object.assign(Settings, Settings),
MonitoringController: Object.assign(MonitoringController, MonitoringController),
ChecklistController: Object.assign(ChecklistController, ChecklistController),
ManageQuestController: Object.assign(ManageQuestController, ManageQuestController),
QuestController: Object.assign(QuestController, QuestController),
}

export default Controllers