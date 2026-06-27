import { avaai } from '../avaaiClient'

class SchedulerLogService {
  async list(params = {}) {
    return await avaai.entities.SchedulerLog.list(params)
  }
  async getById(id) {
    return await avaai.entities.SchedulerLog.get(id)
  }
  async create(data) {
    return await avaai.entities.SchedulerLog.create(data)
  }
  async truncate() {
    return await avaai.entities.SchedulerLog.truncate()
  }
}
export default SchedulerLogService
