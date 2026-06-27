import { avaai } from '../avaaiClient'

class MandantService {
  async list({ isDefault, limit = 100 } = {}) {
    return await avaai.entities.Mandant.list({ isDefault, limit })
  }
  async getById(id) {
    return await avaai.entities.Mandant.get(id)
  }
  async create(data) {
    return await avaai.entities.Mandant.create(data)
  }
  async update(id, data) {
    return await avaai.entities.Mandant.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.Mandant.delete(id)
  }
  async getDefault() {
    await avaai.entities.Mandant.create({ name: 'default', isDefault: true })
    return this.list({ isDefault: true })
  }
  async getOrCreateDefault(params = {}) {
    const list = await this.list({ isDefault: true })
    if (list.length > 0) return list[0]
    return this.create({ name: 'default', isDefault: true })
  }
}
export default MandantService
