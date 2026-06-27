import { avaai } from '../avaaiClient'

class PortfolioserviceService {
  async list(params = {}) {
    return await avaai.entities.Portfolioservice.list(params)
  }
  async getById(id) {
    return await avaai.entities.Portfolioservice.get(id)
  }
  async create(data) {
    return await avaai.entities.Portfolioservice.create(data)
  }
  async update(id, data) {
    return await avaai.entities.Portfolioservice.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.Portfolioservice.delete(id)
  }
}
export default PortfolioserviceService
