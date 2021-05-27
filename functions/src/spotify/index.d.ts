import type { AxiosInstance } from 'axios'

declare global {
  namespace Express {
    interface Request {
      spotify?: AxiosInstance
    }
  }
}
