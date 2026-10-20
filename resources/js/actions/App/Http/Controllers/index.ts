import Api from './Api'
import SiteRatingController from './SiteRatingController'
import SiteFeedbackController from './SiteFeedbackController'
import CertificateVerificationController from './CertificateVerificationController'
import PublicEventController from './PublicEventController'
import PublicSurveyController from './PublicSurveyController'
import CertificateDocumentController from './CertificateDocumentController'
import CertificateFileController from './CertificateFileController'
import DashboardController from './DashboardController'
import EventController from './EventController'
import EventRegistrationController from './EventRegistrationController'
import CertificateRequestController from './CertificateRequestController'
import MyProfileController from './MyProfileController'
import PersonProfileController from './PersonProfileController'
import FollowController from './FollowController'
import PeopleSearchController from './PeopleSearchController'
import NotificationController from './NotificationController'
import TourSeenController from './TourSeenController'
import PostController from './PostController'
import PostTagSuggestionController from './PostTagSuggestionController'
import NewerPostsController from './NewerPostsController'
import LivePostsController from './LivePostsController'
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
import PublicUploadController from './PublicUploadController'
const Controllers = {
    Api: Object.assign(Api, Api),
SiteRatingController: Object.assign(SiteRatingController, SiteRatingController),
SiteFeedbackController: Object.assign(SiteFeedbackController, SiteFeedbackController),
CertificateVerificationController: Object.assign(CertificateVerificationController, CertificateVerificationController),
PublicEventController: Object.assign(PublicEventController, PublicEventController),
PublicSurveyController: Object.assign(PublicSurveyController, PublicSurveyController),
CertificateDocumentController: Object.assign(CertificateDocumentController, CertificateDocumentController),
CertificateFileController: Object.assign(CertificateFileController, CertificateFileController),
DashboardController: Object.assign(DashboardController, DashboardController),
EventController: Object.assign(EventController, EventController),
EventRegistrationController: Object.assign(EventRegistrationController, EventRegistrationController),
CertificateRequestController: Object.assign(CertificateRequestController, CertificateRequestController),
MyProfileController: Object.assign(MyProfileController, MyProfileController),
PersonProfileController: Object.assign(PersonProfileController, PersonProfileController),
FollowController: Object.assign(FollowController, FollowController),
PeopleSearchController: Object.assign(PeopleSearchController, PeopleSearchController),
NotificationController: Object.assign(NotificationController, NotificationController),
TourSeenController: Object.assign(TourSeenController, TourSeenController),
PostController: Object.assign(PostController, PostController),
PostTagSuggestionController: Object.assign(PostTagSuggestionController, PostTagSuggestionController),
NewerPostsController: Object.assign(NewerPostsController, NewerPostsController),
LivePostsController: Object.assign(LivePostsController, LivePostsController),
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
PublicUploadController: Object.assign(PublicUploadController, PublicUploadController),
}

export default Controllers