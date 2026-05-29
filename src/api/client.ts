import axios, { AxiosInstance, AxiosError } from 'axios';
import { ConclaveResponse } from '../types/api';

class ConclaveApiClient {
  private instance: AxiosInstance;

  constructor(baseURL: string, token?: string) {
    this.instance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
  }

  public setToken(token: string) {
    this.instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  public async get<T>(url: string, params?: any): Promise<T> {
    try {
      const response = await this.instance.get<ConclaveResponse<T>>(url, { params });
      if (response.data.status === 'success') {
        return response.data.data;
      }
      throw new Error(`API Error: ${response.data.error?.message || 'Unknown error'}`);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  public async post<T, R = any>(url: string, data: T): Promise<R> {
    try {
      const response = await this.instance.post<ConclaveResponse<R>>(url, data);
      if (response.data.status === 'success') {
        return response.data.data;
      }
      throw new Error(`API Error: ${response.data.error?.message || 'Unknown error'}`);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  public async patch<T, R = any>(url: string, data: T): Promise<R> {
    try {
      const response = await this.instance.patch<ConclaveResponse<R>>(url, data);
      if (response.data.status === 'success') {
        return response.data.data;
      }
      throw new Error(`API Error: ${response.data.error?.message || 'Unknown error'}`);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  public async delete<R = any>(url: string): Promise<R> {
    try {
      const response = await this.instance.delete<ConclaveResponse<R>>(url);
      if (response.data.status === 'success') {
        return response.data.data;
      }
      throw new Error(`API Error: ${response.data.error?.message || 'Unknown error'}`);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  private handleError(error: any) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ConclaveResponse<any>>;
      const message = axiosError.response?.data?.error?.message || axiosError.message;
      console.error(`[API Error] ${message}`);
    } else {
      console.error(`[Unexpected Error]`, error);
    }
  }
}

export const api = new ConclaveApiClient(import.meta.env.VITE_API_URL || 'https://conclave-roan.vercel.app');
