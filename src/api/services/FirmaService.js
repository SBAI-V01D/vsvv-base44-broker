import { avaai } from '../avaaiClient'

class FirmaService {
  async list(params = {}) {
    return await avaai.entities.Firma.list(params)
  }
  async getById(id) {
    return await avaai.entities.Firma.get(id)
  }
  async create(data) {
    return await avaai.entities.Firma.create(data)
  }
  async update(id, data) {
    return await avaai.entities.Firma.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.Firma.delete(id)
  }
}
export default FirmaService
