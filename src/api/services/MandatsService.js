import { avaai } from '../avaaiClient'

class MandatsService {
  async list(params = {}) {
    return await avaai.entities.Mandats.list(params)
  }
  async getById(id) {
    return await avaai.entities.Mandats.get(id)
  }
  async create(data) {
    return await avaai.entities.Mandats.create(data)
  }
  async update(id, data) {
    return await avaai.entities.Mandats.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.Mandats.delete(id)
  }
}
export default MandatsService
