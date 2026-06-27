import { avaai } from '../avaaiClient'

class AusschreibungService {
  async list(params = {}) {
    return await avaai.entities.Ausschreibung.list(params)
  }
  async getById(id) {
    return await avaai.entities.Ausschreibung.get(id)
  }
  async create(data) {
    return await avaai.entities.Ausschreibung.create(data)
  }
  async update(id, data) {
    return await avaai.entities.Ausschreibung.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.Ausschreibung.delete(id)
  }
}
export default AusschreibungService
