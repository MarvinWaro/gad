import GadEventController from './GadEventController'
import CarouselSlideController from './CarouselSlideController'
import SiteFeedbackController from './SiteFeedbackController'
import SurveyController from './SurveyController'
import SurveySummaryController from './SurveySummaryController'
import SurveyResponseController from './SurveyResponseController'
import MonitoringReviewController from './MonitoringReviewController'
import ChecklistResponseController from './ChecklistResponseController'
const Admin = {
    GadEventController: Object.assign(GadEventController, GadEventController),
CarouselSlideController: Object.assign(CarouselSlideController, CarouselSlideController),
SiteFeedbackController: Object.assign(SiteFeedbackController, SiteFeedbackController),
SurveyController: Object.assign(SurveyController, SurveyController),
SurveySummaryController: Object.assign(SurveySummaryController, SurveySummaryController),
SurveyResponseController: Object.assign(SurveyResponseController, SurveyResponseController),
MonitoringReviewController: Object.assign(MonitoringReviewController, MonitoringReviewController),
ChecklistResponseController: Object.assign(ChecklistResponseController, ChecklistResponseController),
}

export default Admin