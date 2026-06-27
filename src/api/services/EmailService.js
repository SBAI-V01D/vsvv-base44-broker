import { avaai } from '../avaaiClient'

class EmailService {
  async listTemplates(params = {}) {
    return await avaai.entities.EmailTemplate.list(params)
  }
  async getTemplateById(id) {
    return await avaai.entities.EmailTemplate.get(id)
  }
  async createTemplate(data) {
    return await avaai.entities.EmailTemplate.create(data)
  }
  async updateTemplate(id, data) {
    return await avaai.entities.EmailTemplate.update(id, data)
  }
  async deleteTemplate(id) {
    return await avaai.entities.EmailTemplate.delete(id)
  }
  async listCampaigns(params = {}) {
    return await avaai.entities.EmailCampaign.list(params)
  }
  async getCampaignById(id) {
    return await avaai.entities.EmailCampaign.get(id)
  }
  async createCampaign(data) {
    return await avaai.entities.EmailCampaign.create(data)
  }
  async updateCampaign(id, data) {
    return await avaai.entities.EmailCampaign.update(id, data)
  }
  async deleteCampaign(id) {
    return await avaai.entities.EmailCampaign.delete(id)
  }
}
export default EmailService
