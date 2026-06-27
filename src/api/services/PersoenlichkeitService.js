import { avaai } from '../avaaiClient'

class PersoenlichkeitService {
  async list(params = {}) {
    return await avaai.entities.Persoenlichkeit.list(params)
  }
  async getById(id) {
    return await avaai.entities.Persoenlichkeit.get(id)
  }
  async create(data) {
    return await avaai.entities.Persoenlichkeit.create(data)
  }
  async update(id, data) {
    return await avaai.entities.Persoenlichkeit.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.Persoenlichkeit.delete(id)
  }
}
export default PersoenlichkeitService
