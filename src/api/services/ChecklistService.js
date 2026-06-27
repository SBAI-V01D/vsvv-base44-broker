import { avaai } from '../avaaiClient'

class ChecklistService {
  async list(params = {}) {
    return await avaai.entities.Checklist.list(params)
  }
  async getById(id) {
    return await avaai.entities.Checklist.get(id)
  }
  async create(data) {
    return await avaai.entities.Checklist.create(data)
  }
  async update(id, data) {
    return await avaai.entities.Checklist.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.Checklist.delete(id)
  }
}
export default ChecklistService
