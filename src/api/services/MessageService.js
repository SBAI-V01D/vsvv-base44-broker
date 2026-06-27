import { avaai } from '../avaaiClient'

class MessageService {
  async list(params = {}) {
    return await avaai.entities.Message.list(params)
  }
  async getById(id) {
    return await avaai.entities.Message.get(id)
  }
  async create(data) {
    return await avaai.entities.Message.create(data)
  }
  async update(id, data) {
    return await avaai.entities.Message.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.Message.delete(id)
  }
}
export default MessageService
