import { avaai } from '../avaaiClient'

class KrankenkassenService {
  async list(params = {}) {
    return await avaai.entities.KrankenkassenVergleich.list(params)
  }
  async getById(id) {
    return await avaai.entities.KrankenkassenVergleich.get(id)
  }
  async create(data) {
    return await avaai.entities.KrankenkassenVergleich.create(data)
  }
  async update(id, data) {
    return await avaai.entities.KrankenkassenVergleich.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.KrankenkassenVergleich.delete(id)
  }
  async analyse(comparisonId) {
    return await avaai.entities.VergleichsAnalyse.list({ comparisonId })
  }
}
export default KrankenkassenService
