import academicYears from './academic-years'
import users from './users'
import regions from './regions'
import roles from './roles'
import respondentGroups from './respondent-groups'
import heis from './heis'
import surveyDirectories from './survey-directories'
import activityLogs from './activity-logs'
import ratings from './ratings'
import studentCounts from './student-counts'
import badges from './badges'
const settings = {
    academicYears: Object.assign(academicYears, academicYears),
users: Object.assign(users, users),
regions: Object.assign(regions, regions),
roles: Object.assign(roles, roles),
respondentGroups: Object.assign(respondentGroups, respondentGroups),
heis: Object.assign(heis, heis),
surveyDirectories: Object.assign(surveyDirectories, surveyDirectories),
activityLogs: Object.assign(activityLogs, activityLogs),
ratings: Object.assign(ratings, ratings),
studentCounts: Object.assign(studentCounts, studentCounts),
badges: Object.assign(badges, badges),
}

export default settings