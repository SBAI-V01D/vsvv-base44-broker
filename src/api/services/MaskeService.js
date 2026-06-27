import { avaai } from '../avaaiClient'

class MaskeService {
  async list(params = {}) {
    return await avaai.entities.Maske.list(params)
  }
  async getById(id) {
    return await avaai.entities.Maske.get(id)
  }
  async create(data) {
    return await avaai.entities.Maske.create(data)
  }
  async update(id, data) {
    return await avaai.entities.Maske.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.Maske.delete(id)
  }
}
export default MaskeService
