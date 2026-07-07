/**
 * UserService — CRUD for User and Advisor entities.
 */
import { avaai } from '../avaaiClient'

class UserService {
  /**
   * Get current user profile
   * @returns {Promise<object>}
   */
  async getMe() {
    return await avaai.auth.me()
  }

  /**
   * List all users
   * @param {object} params
   * @returns {Promise<object>}
   */
  async list(params = {}) {
    return await avaai.entities.User.list(params)
  }

  /**
   * Get user by ID
   * @param {string|number} id
   * @returns {Promise<object>}
   */
  async getById(id) {
    return await avaai.entities.User.get(id)
  }

  /**
   * Create a new user
   * @param {object} data
   * @returns {Promise<object>}
   */
  async create(data) {
    return await avaai.entities.User.create(data)
  }

  /**
   * Update a user
   * @param {string|number} id
   * @param {object} data
   * @returns {Promise<object>}
   */
  async update(id, data) {
    return await avaai.entities.User.update(id, data)
  }

  /**
   * Delete a user
   * @param {string|number} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    return await avaai.entities.User.delete(id)
  }

  // ========== ADVISOR ==========

  /**
   * List advisors
   * @param {object} params
   */
  async listAdvisors(params = {}) {
    return await avaai.entities.Advisor.list(params)
  }

  /**
   * Get advisor by ID
   * @param {string|number} id
   */
  async getAdvisorById(id) {
    return await avaai.entities.Advisor.get(id)
  }

  /**
   * Create advisor
   * @param {object} data
   */
  async createAdvisor(data) {
    return await avaai.entities.Advisor.create(data)
  }

  /**
   * Update advisor
   * @param {string|number} id
   * @param {object} data
   */
  async updateAdvisor(id, data) {
    return await avaai.entities.Advisor.update(id, data)
  }

  /**
   * Delete advisor
   * @param {string|number} id
   */
  async deleteAdvisor(id) {
    return await avaai.entities.Advisor.delete(id)
  }
}

export default UserService
