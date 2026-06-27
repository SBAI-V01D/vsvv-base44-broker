/**
 * BaseService — Generic API service mixin.
 *
 * Wraps the avaai client with typed methods, error handling and pagination.
 * All module services extend this class.
 */
import { avaai } from '../avaaiClient'

class BaseService {
  constructor(entityName) {
    this.entityName = entityName
  }

  /**
   * List all records (paginated).
   * @param {object} params - Filter, limit, offset, sortBy
   * @param {number} [params.limit=50]
   * @param {number} [params.offset=0]
   * @param {string} [params.sortBy]
   * @param {string} [params.order='asc']
   */
  async list(params = {}) {
    const {
      limit = 50,
      offset = 0,
      sortBy,
      order = 'asc',
      ...filters
    } = params

    const query = {
      limit,
      skip: offset,
    }

    if (sortBy) query.sortBy = sortBy
    if (order) query.order = order

    const response = await avaai[this.entityName].list(query)

    return {
      data: response || [],
    }
  }

  /**
   * Get a single record by ID.
   * @param {string|number} id
   */
  async getById(id) {
    return await avaai[this.entityName].get(id)
  }

  /**
   * Create a new record.
   * @param {object} data
   */
  async create(data) {
    return await avaai[this.entityName].create(data)
  }

  /**
   * Update a record partially.
   * @param {string|number} id
   * @param {object} data
   */
  async update(id, data) {
    return await avaai[this.entityName].update(id, data)
  }

  /**
   * Delete a record.
   * @param {string|number} id
   */
  async delete(id) {
    return await avaai[this.entityName].delete(id)
  }

  /**
   * Search across fields.
   * @param {string} query
   */
  async search(query) {
    return await avaai[this.entityName].search({ query })
  }

  /**
   * Upload a file to a record.
   * @param {string|number} id
   * @param {File|Blob} file
   * @param {string} fieldName
   */
  async uploadFile(id, file, fieldName = 'file') {
    return await avaai.integrations.Core.UploadFile({
      entity: this.entityName,
      id,
      field: fieldName,
      file,
    })
  }

  /**
   * Paginated list with total count.
   * @param {object} params
   * @param {number} params.page
   * @param {number} params.pageSize
   * @returns {Promise<{data: array[], total: number, page: number, pageSize: number}>}
   */
  async listPaginated(params = {}) {
    const page = params.page || 1
    const pageSize = params.pageSize || 50

    const result = await this.list({
      limit: pageSize,
      offset: (page - 1) * pageSize,
      ...params,
    })

    return {
      ...result,
      page,
      pageSize,
      totalPages: Math.ceil((result.total ?? result.data.length) / pageSize),
    }
  }
}

export default BaseService
