import { avaai } from '../avaaiClient'

class OfferteService {
  async list(params = {}) {
    return await avaai.entities.Offerte.list(params)
  }

  async getById(id) {
    return await avaai.entities.Offerte.get(id)
  }

  async create(data) {
    return await avaai.entities.Offerte.create(data)
  }

  async update(id, data) {
    return await avaai.entities.Offerte.update(id, data)
  }

  async delete(id) {
    return await avaai.entities.Offerte.delete(id)
  }
}

export default OfferteService
