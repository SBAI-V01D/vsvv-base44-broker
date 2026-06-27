import { avaai } from '../avaaiClient'

class CommissionService {
  async list(params = {}) {
    return await avaai.entities.Commission.list(params)
  }

  async getById(id) {
    return await avaai.entities.Commission.get(id)
  }

  async create(data) {
    return await avaai.entities.Commission.create(data)
  }

  async update(id, data) {
    return await avaai.entities.Commission.update(id, data)
  }

  async delete(id) {
    return await avaai.entities.Commission.delete(id)
  }

  async getEntries(commissionId) {
    return avaai.entities.CommissionEntry.list({ commissionId })
  }

  async getRates(params = {}) {
    return avaai.entities.CommissionRate.list(params)
  }

  async getSplits(commissionId) {
    return avaai.entities.CommissionSplit.list({ commissionId })
  }
}

export default CommissionService
