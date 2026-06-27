import { avaai } from '../avaaiClient'

class PricingService {
  async list(params = {}) {
    return await avaai.entities.PricingSuggestion.list(params)
  }
  async getById(id) {
    return await avaai.entities.PricingSuggestion.get(id)
  }
  async create(data) {
    return await avaai.entities.PricingSuggestion.create(data)
  }
  async update(id, data) {
    return await avaai.entities.PricingSuggestion.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.PricingSuggestion.delete(id)
  }
}
export default PricingService
