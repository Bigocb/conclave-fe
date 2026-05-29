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

  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.instance.get<ConclaveResponse<T>>(url, { params });
    return response.data.data;
  }

  async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.instance.post<ConclaveResponse<T>>(url, data);
    return response.data.data;
  }

  async patch<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.instance.patch<ConclaveResponse<T>>(url, data);
    return response.data.data;
  }

  async delete<T = any>(url: string): Promise<T> {
    const response = await this.instance.delete<ConclaveResponse<T>>(url);
    return response.data.data;
  }
}

export const api = new ConclaveApiClient(import.meta.env.VITE_API_URL || 'https://conclave-roan.vercel.app');
