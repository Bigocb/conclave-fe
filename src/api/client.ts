import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { ConclaveResponse } from '../types/api';

export class ConclaveApiClient {
  instance: AxiosInstance;
  private currentOrgId: string | null = null;

  constructor(baseUrl: string) {
    this.instance = axios.create({
      baseURL: baseUrl,
      headers: { 'Content-Type': 'application/json' }
    });

    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('orgId');
          localStorage.removeItem('userId');
          localStorage.removeItem('userEmail');
          // Force full page reload so React re-renders to login screen
          window.location.reload();
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  setOrgId(orgId: string | null) {
    this.currentOrgId = orgId;
    if (orgId) {
      this.instance.defaults.headers.common['X-Org-Id'] = orgId;
    } else {
      delete this.instance.defaults.headers.common['X-Org-Id'];
    }
  }

  private unwrap<T>(response: any): T {
    if (!response) return null as any;
    if (response.status && response.data !== undefined) {
      return response.data as T;
    }
    return response as T;
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const updatedParams = { ...params };
        if (this.currentOrgId && !url.includes('orgId=')) {
      updatedParams.orgId = this.currentOrgId;
    }
    const response = await this.instance.get<ConclaveResponse<T>>(url, { params: updatedParams });
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

  // Memory-specific methods
  async getMemories(category?: string): Promise<any[]> {
    const params = category ? { category } : {};
    const res = await this.get<{ memories: any[] }>('/v1/memory', params);
    return res?.memories || [];
  }

  async getMemory(key: string): Promise<any> {
    const res = await this.get<{ memory: any }>(`/v1/memory/${encodeURIComponent(key)}`);
    return res?.memory;
  }

  async createMemory(key: string, value: string, category?: string): Promise<any> {
    const res = await this.post<{ memory: any }>('/v1/memory', { key, value, category });
    return res?.memory;
  }

  async deleteMemory(key: string): Promise<boolean> {
    const res = await this.delete<{ deleted: boolean }>(`/v1/memory/${encodeURIComponent(key)}`);
    return res?.deleted || false;
  }

  async searchMemories(query: string, limit?: number): Promise<any[]> {
    const res = await this.post<{ memories: any[] }>('/v1/memory/search', { query, limit });
    return res?.memories || [];
  }
}

export const api = new ConclaveApiClient('https://conclave-roan.vercel.app');
