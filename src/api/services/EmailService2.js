import { avaai } from '../avaaiClient'

class EmailService2 {
  async list(params = {}) {
    return await avaai.entities.Email.list(params)
  }
  async getById(id) {
    return await avaai.entities.Email.get(id)
  }
  async create(data) {
    return await avaai.entities.Email.create(data)
  }
  async update(id, data) {
    return await avaai.entities.Email.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.Email.delete(id)
  }
}
export default EmailService2
