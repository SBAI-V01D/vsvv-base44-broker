import { avaai } from '../avaaiClient'

class SocialMediaService {
  async list(params = {}) {
    return await avaai.entities.SocialMedia.list(params)
  }
  async getById(id) {
    return await avaai.entities.SocialMedia.get(id)
  }
  async create(data) {
    return await avaai.entities.SocialMedia.create(data)
  }
  async update(id, data) {
    return await avaai.entities.SocialMedia.update(id, data)
  }
  async delete(id) {
    return await avaai.entities.SocialMedia.delete(id)
  }
}
export default SocialMediaService
