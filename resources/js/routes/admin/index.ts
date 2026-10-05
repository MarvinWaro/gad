import events from './events'
import carousels from './carousels'
import feedback from './feedback'
import surveys from './surveys'
import monitoring from './monitoring'
import checklists from './checklists'
const admin = {
    events: Object.assign(events, events),
carousels: Object.assign(carousels, carousels),
feedback: Object.assign(feedback, feedback),
surveys: Object.assign(surveys, surveys),
monitoring: Object.assign(monitoring, monitoring),
checklists: Object.assign(checklists, checklists),
}

export default admin