import { avaai } from '../avaaiClient'

class DealService {
  async list(params = {}) {
    return await avaai.entities.Deal.list(params)
  }

  async getById(id) {
    return await avaai.entities.Deal.get(id)
  }

  async create(data) {
    return await avaai.entities.Deal.create(data)
  }

  async update(id, data) {
    return await avaai.entities.Deal.update(id, data)
  }

  async delete(id) {
    return await avaai.entities.Deal.delete(id)
  }
}

export default DealService
