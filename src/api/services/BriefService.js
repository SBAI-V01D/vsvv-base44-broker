import { avaai } from '../avaaiClient'

class BriefService {
  async list(params = {}) {
    return await avaai.entities.Brief.list(params)
  }
  async getById(id) {
    return await avaai.entities.Brief.get(id)
  }
  async create(data) {
    return await avaai.entities.Brief.create(data)
  }
  async update(id, data) {
    return await avaai.entities.Brief.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.Brief.delete(id)
  }
}
export default BriefService
