import { avaai } from '../avaaiClient'

class DokumentService {
  async list(params = {}) {
    return await avaai.entities.Dokument.list(params)
  }
  async getById(id) {
    return await avaai.entities.Dokument.get(id)
  }
  async create(data) {
    return await avaai.entities.Dokument.create(data)
  }
  async update(id, data) {
    return await avaai.entities.Dokument.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.Dokument.delete(id)
  }
  async uploadFile(id, file, fieldName = 'file') {
    return await avaai.integrations.Core.UploadFile({
      entity: 'Dokument',
      id,
      field: fieldName,
      file,
    })
  }
}
export default DokumentService
