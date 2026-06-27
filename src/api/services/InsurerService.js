import { avaai } from '../avaaiClient'

class InsurerService {
  async list(params = {}) {
    return await avaai.entities.VersichererDB.list(params)
  }
  async getById(id) {
    return await avaai.entities.VersichererDB.get(id)
  }
  async create(data) {
    return await avaai.entities.VersichererDB.create(data)
  }
  async update(id, data) {
    return await avaai.entities.VersichererDB.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.VersichererDB.delete(id)
  }
  async search(params = {}) {
    return await avaai.entities.VersichererDB.list({ ...params })
  }
}
export default InsurerService
