import { avaai } from '../avaaiClient'

class TelefonService {
  async list(params = {}) {
    return await avaai.entities.Telefon.list(params)
  }
  async getById(id) {
    return await avaai.entities.Telefon.get(id)
  }
  async create(data) {
    return await avaai.entities.Telefon.create(data)
  }
  async update(id, data) {
    return await avaai.entities.Telefon.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.Telefon.delete(id)
  }
}
export default TelefonService
