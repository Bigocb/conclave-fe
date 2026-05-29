import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { ConclaveResponse } from '../types/api';

export class ConclaveApiClient {
  instance: AxiosInstance;

  constructor(baseUrl: string) {
    this.instance = axios.create({
      baseURL: baseUrl,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  setToken(token: string) {
    this.instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Generic unwrapper for Conclave API responses.
   * The API usually wraps data in { status, data, meta }.
   * However, some endpoints (like /auth/login) return the data directly.
   */
  private unwrap<T>(response: any): T {
    if (!response) return null;
    // If the response has a 'status' and 'data' field, it's a wrapped ConclaveResponse
    if (response.status && response.data !== undefined) {
      return response.data;
    }
    // Otherwise, assume it's a direct response
    return response;
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.instance.get<ConclaveResponse<T>>(url, { params });
    return this.unwrap(response.data);
  }

  async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.instance.post<ConclaveResponse<T>>(url, data);
    return this.unwrap(response.data);
  }

  async patch<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.instance.patch<ConclaveResponse<T>>(url, data);
    return this.unwrap(response.data);
  }

  async delete<T = any>(url: string): Promise<T> {
    const response = await this.instance.delete<ConclaveResponse<T>>(url);
    return this.unwrap(response.data);
  }
}

export const api = new ConclaveApiClient(import.meta.env.VITE_API_URL || 'https://conclave-roan.vercel.app');
