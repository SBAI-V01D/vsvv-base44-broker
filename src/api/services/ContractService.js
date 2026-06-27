import { avaai } from '../avaaiClient'

class ContractService {
  async list(params = {}) {
    return await avaai.entities.Contract.list(params)
  }

  async getById(id) {
    return await avaai.entities.Contract.get(id)
  }

  async create(data) {
    return await avaai.entities.Contract.create(data)
  }

  async update(id, data) {
    return await avaai.entities.Contract.update(id, data)
  }

  async delete(id) {
    return await avaai.entities.Contract.delete(id)
  }

  async getByCustomer(customerId) {
    return this.list({ customerId })
  }

  async getAdvisors(contractId) {
    return avaai.entities.ContractAdvisor.list({ contractId })
  }

  async linkAdvisors(data) {
    return avaai.entities.ContractAdvisor.create(data)
  }
}

export default ContractService
