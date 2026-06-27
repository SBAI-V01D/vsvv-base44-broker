import { avaai } from '../avaaiClient'

class BestellungService {
  async list(params = {}) {
    return await avaai.entities.Bestellung.list(params)
  }
  async getById(id) {
    return await avaai.entities.Bestellung.get(id)
  }
  async create(data) {
    return await avaai.entities.Bestellung.create(data)
  }
  async update(id, data) {
    return await avaai.entities.Bestellung.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.Bestellung.delete(id)
  }
}
export default BestellungService
