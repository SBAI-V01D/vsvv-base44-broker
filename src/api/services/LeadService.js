import { avaai } from '../avaaiClient'

class LeadService {
  async list(params = {}) {
    return await avaai.entities.Lead.list(params)
  }

  async getById(id) {
    return await avaai.entities.Lead.get(id)
  }

  async create(data) {
    return await avaai.entities.Lead.create(data)
  }

  async update(id, data) {
    return await avaai.entities.Lead.update(id, data)
  }

  async delete(id) {
    return await avaai.entities.Lead.delete(id)
  }
}

export default LeadService
