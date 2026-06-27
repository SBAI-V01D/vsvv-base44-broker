import { avaai } from '../avaaiClient'

class KalenderService {
  async list(params = {}) {
    return await avaai.entities.Kalender.list(params)
  }
  async getById(id) {
    return await avaai.entities.Kalender.get(id)
  }
  async create(data) {
    return await avaai.entities.Kalender.create(data)
  }
  async update(id, data) {
    return await avaai.entities.Kalender.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.Kalender.delete(id)
  }
}
export default KalenderService
