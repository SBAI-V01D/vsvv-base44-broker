/**
 * CustomerService — CRUD for Customer and Broker entities.
 */
import { avaai } from '../avaaiClient'

class CustomerService {
  async list(params = {}) {
    return await avaai.entities.Customer.list(params)
  }

  async getById(id) {
    return await avaai.entities.Customer.get(id)
  }

  async create(data) {
    return await avaai.entities.Customer.create(data)
  }

  async update(id, data) {
    return await avaai.entities.Customer.update(id, data)
  }

  async delete(id) {
    return await avaai.entities.Customer.delete(id)
  }

  async search(params = {}) {
    return await avaai.entities.Customer.list({ ...params })
  }

  /**
   * Get customers of a specific broker
   * @param {string|number} brokerId
   */
  async getByBroker(brokerId) {
    return await this.list({ brokerId })
  }

  /**
   * Get advisors linked to a customer
   * @param {string|number} customerId
   * @returns {Promise<object>}
   */
  async getAdvisors(customerId) {
    return await avaai.entities.CustomerAdvisor.list({ customerId })
  }

  /**
   * Link an advisor to a customer
   * @param {object} data
   * @returns {Promise<object>}
   */
  async linkAdvisor(data) {
    return await avaai.entities.CustomerAdvisor.create(data)
  }
}

export default CustomerService
