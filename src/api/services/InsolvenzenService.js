import { avaai } from '../avaaiClient'

class InsolvenzenService {
  async list(params = {}) {
    return await avaai.entities.Insolvenzen.list(params)
  }
  async getById(id) {
    return await avaai.entities.Insolvenzen.get(id)
  }
  async create(data) {
    return await avaai.entities.Insolvenzen.create(data)
  }
  async update(id, data) {
    return await avaai.entities.Insolvenzen.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.Insolvenzen.delete(id)
  }
}
export default InsolvenzenService
