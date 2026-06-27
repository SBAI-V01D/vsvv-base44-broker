import { avaai } from '../avaaiClient'

class PreisService {
  async list(params = {}) {
    return await avaai.entities.Preis.list(params)
  }
  async getById(id) {
    return await avaai.entities.Preis.get(id)
  }
  async create(data) {
    return await avaai.entities.Preis.create(data)
  }
  async update(id, data) {
    return await avaai.entities.Preis.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.Preis.delete(id)
  }
}
export default PreisService
