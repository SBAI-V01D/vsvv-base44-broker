import { avaai } from '../avaaiClient'

class ApplicationService {
  async list(params = {}) {
    return await avaai.entities.Application.list(params)
  }
  async getById(id) {
    return await avaai.entities.Application.get(id)
  }
  async create(data) {
    return await avaai.entities.Application.create(data)
  }
  async update(id, data) {
    return await avaai.entities.Application.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.Application.delete(id)
  }
}
export default ApplicationService
