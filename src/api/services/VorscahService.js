import { avaai } from '../avaaiClient'

class VorscahService {
  async list(params = {}) {
    return await avaai.entities.Vorscah.list(params)
  }
  async getById(id) {
    return await avaai.entities.Vorscah.get(id)
  }
  async create(data) {
    return await avaai.entities.Vorscah.create(data)
  }
  async update(id, data) {
    return await avaai.entities.Vorscah.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.Vorscah.delete(id)
  }
}
export default VorscahService
