import { avaai } from '../avaaiClient'

class WarnungService {
  async list(params = {}) {
    return await avaai.entities.Warnung.list(params)
  }
  async getById(id) {
    return await avaai.entities.Warnung.get(id)
  }
  async create(data) {
    return await avaai.entities.Warnung.create(data)
  }
  async update(id, data) {
    return await avaai.entities.Warnung.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.Warnung.delete(id)
  }
}
export default WarnungService
