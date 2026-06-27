/**
 * AdvisoryDossierService — Operations for advisory dossiers.
 */
import BaseService from './BaseService'

class AdvisoryDossierService extends BaseService {
  constructor() {
    super('AdvisoryDossier')
  }

  /**
   * Get dossiers filtered by enterprise/context
   * @param {object} params
   */
  async filter(params = {}) {
    return await avaai.entities.AdvisoryDossier.filter(params)
  }

  /**
   * Get dossiers for a specific customer
   * @param {string|number} customerId
   */
  async getByCustomer(customerId) {
    return await this.list({ customerId })
  }

  /**
   * Get dossiers for a specific contract
   * @param {string|number} contractId
   */
  async getByContract(contractId) {
    return await this.list({ contractId })
  }
}

export default AdvisoryDossierService
