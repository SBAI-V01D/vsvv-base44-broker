import { avaai } from '../avaaiClient'

class ClaimService {
  async list(params = {}) {
    return await avaai.entities.Claim.list(params)
  }
  async getById(id) {
    return await avaai.entities.Claim.get(id)
  }
  async create(data) {
    return await avaai.entities.Claim.create(data)
  }
  async update(id, data) {
    return await avaai.entities.Claim.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.Claim.delete(id)
  }
}
export default ClaimService
