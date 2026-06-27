import { avaai } from '../avaaiClient'

class InteractionService {
  async list(params = {}) {
    return await avaai.entities.Interaction.list(params)
  }
  async getById(id) {
    return await avaai.entities.Interaction.get(id)
  }
  async create(data) {
    return await avaai.entities.Interaction.create(data)
  }
  async update(id, data) {
    return await avaai.entities.Interaction.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.Interaction.delete(id)
  }
}
export default InteractionService
