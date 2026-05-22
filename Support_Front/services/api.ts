import axios, { AxiosInstance } from 'axios'

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://172.20.10.6:3000'

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('supportToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('supportToken')
          localStorage.removeItem('supportUser')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // Thread APIs
  async getThreads(params?: {
    type?: string
    status?: string
    limit?: number
    skip?: number
  }) {
    const response = await this.api.get('/messages/threads', { params })
    return response.data
  }

  async getThreadById(threadId: string) {
    const response = await this.api.get(`/messages/threads/${threadId}`)
    return response.data
  }

  async updateThreadStatus(threadId: string, status: string) {
    const response = await this.api.patch(`/messages/threads/${threadId}/status`, {
      status,
    })
    return response.data
  }

  async assignThread(threadId: string, assignedTo: string) {
    const response = await this.api.patch(`/messages/threads/${threadId}/assign`, {
      assignedTo,
    })
    return response.data
  }

  async markThreadAsRead(threadId: string) {
    const response = await this.api.post(`/messages/threads/${threadId}/read`)
    return response.data
  }

  // Message APIs
  async getMessages(threadId: string, params?: {
    limit?: number
    before?: string
    after?: string
  }) {
    const response = await this.api.get(`/messages/threads/${threadId}/messages`, {
      params,
    })
    return response.data
  }

  async sendMessage(threadId: string, data: {
    type: string
    content: any
    replyTo?: string
  }) {
    const response = await this.api.post(`/messages/threads/${threadId}/messages`, data)
    return response.data
  }

  async sendImage(threadId: string, formData: FormData) {
    const response = await this.api.post(
      `/messages/threads/${threadId}/messages/image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  }

  async editMessage(messageId: string, content: string) {
    const response = await this.api.patch(`/messages/${messageId}`, { content })
    return response.data
  }

  async deleteMessage(messageId: string) {
    const response = await this.api.delete(`/messages/${messageId}`)
    return response.data
  }

  async searchMessages(query: string, limit = 20, skip = 0) {
    const response = await this.api.get('/messages/search', {
      params: { q: query, limit, skip },
    })
    return response.data
  }

  // Support APIs
  async getThreadStats() {
    const response = await this.api.get('/messages/threads/stats')
    return response.data
  }

  async createThreadFromTicket(ticketId: string) {
    const response = await this.api.post('/messages/threads/from-ticket', {
      ticketId,
    })
    return response.data
  }

  async getSupportStats(agentId?: string) {
    const response = await this.api.get('/messages/support/stats', {
      params: agentId ? { agentId } : {},
    })
    return response.data
  }

  async getUnreadCount() {
    const response = await this.api.get('/messages/unread/count')
    return response.data
  }

  // Support Ticket APIs
  async getSupportTickets() {
    const response = await this.api.get('/support')
    return response.data
  }

  async getSupportTicketById(id: string) {
    const response = await this.api.get(`/support/${id}`)
    return response.data
  }
}

export const apiService = new ApiService()
