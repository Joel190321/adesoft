// Production API client that switches between localStorage and HTTP API
import { storage } from '../storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const USE_API = process.env.EXPO_PUBLIC_USE_API === 'true';

class APIClient {
  private async request(endpoint: string, options: RequestInit = {}) {
    if (!USE_API) {
      // Use localStorage for development/web
      return null;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new APIClient();