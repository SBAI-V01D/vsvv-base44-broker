import { avaai } from '../avaaiClient'

class TaskService {
  async list(params = {}) {
    return await avaai.entities.Task.list(params)
  }

  async getById(id) {
    return await avaai.entities.Task.get(id)
  }

  async create(data) {
    return await avaai.entities.Task.create(data)
  }

  async update(id, data) {
    return await avaai.entities.Task.update(id, data)
  }

  async delete(id) {
    return await avaai.entities.Task.delete(id)
  }
}

export default TaskService
