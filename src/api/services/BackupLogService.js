import { avaai } from '../avaaiClient'

class BackupLogService {
  async list(params = {}) {
    return await avaai.entities.BackupLog.list(params)
  }
  async getById(id) {
    return await avaai.entities.BackupLog.get(id)
  }
  async create(data) {
    return await avaai.entities.BackupLog.create(data)
  }
  async truncate() {
    return await avaai.entities.BackupLog.truncate()
  }
}
export default BackupLogService
