import { avaai } from '../avaaiClient'

class SystemConfigService {
  async list(params = {}) {
    return await avaai.entities.SystemConfig.list(params)
  }
  async getById(id) {
    return await avaai.entities.SystemConfig.get(id)
  }
  async create(data) {
    return await avaai.entities.SystemConfig.create(data)
  }
  async update(id, data) {
    return await avaai.entities.SystemConfig.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.SystemConfig.delete(id)
  }
  async clear() {
    return await avaai.entities.SystemConfig.truncate()
  }
}
export default SystemConfigService
