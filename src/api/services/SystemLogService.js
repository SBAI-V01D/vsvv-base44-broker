import { avaai } from '../avaaiClient'

class SystemLogService {
  async list(params = {}) {
    return await avaai.entities.SystemLog.list(params)
  }
  async getById(id) {
    return await avaai.entities.SystemLog.get(id)
  }
  async create(data) {
    return await avaai.entities.SystemLog.create(data)
  }
  async delete(id) {
    return await avaai.entities.SystemLog.delete(id)
  }
  async clear() {
    return await avaai.entities.SystemLog.truncate()
  }
  async update(id, data) {
    return await avaai.entities.SystemLog.update(id, data)
  }
}
export default SystemLogService
