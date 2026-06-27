import { avaai } from '../avaaiClient'

class DocumentService {
  async list(params = {}) {
    return await avaai.entities.Document.list(params)
  }

  async getById(id) {
    return await avaai.entities.Document.get(id)
  }

  async create(data) {
    return await avaai.entities.Document.create(data)
  }

  async update(id, data) {
    return await avaai.entities.Document.update(id, data)
  }

  async delete(id) {
    return await avaai.entities.Document.delete(id)
  }

  async uploadFile(id, file, fieldName = 'file') {
    return await avaai.integrations.Core.UploadFile({
      entity: 'Document',
      id,
      field: fieldName,
      file,
    })
  }
}

export default DocumentService
