import { avaai } from '../avaaiClient'

class BeraterSchnittstelleService {
  async list(params = {}) {
    return await avaai.entities.BeraterSchnittstelle.list(params)
  }
  async getById(id) {
    return await avaai.entities.BeraterSchnittstelle.get(id)
  }
  async create(data) {
    return await avaai.entities.BeraterSchnittstelle.create(data)
  }
  async update(id, data) {
    return await avaai.entities.BeraterSchnittstelle.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.BeraterSchnittstelle.delete(id)
  }
}
export default BeraterSchnittstelleService
