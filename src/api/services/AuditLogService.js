import { avaai } from '../avaaiClient'

class AuditLogService {
  async list(params = {}) {
    return await avaai.entities.AuditLog.list(params)
  }
  async getById(id) {
    return await avaai.entities.AuditLog.get(id)
  }
  async create(data) {
    return await avaai.entities.AuditLog.create(data)
  }
  async truncate() {
    return await avaai.entities.AuditLog.truncate()
  }
}
export default AuditLogService
