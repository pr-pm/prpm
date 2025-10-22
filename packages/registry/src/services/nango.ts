/**
 * Nango service for GitHub authentication
 */

import { Nango } from '@nangohq/node';
import { config } from '../config.js';
import { User } from '../types.js';

export class NangoService {
  private nango: Nango;

  constructor() {
    if (!config.nango.apiKey) {
      throw new Error('NANGO_API_KEY environment variable is required');
    }
    if (!config.nango.host) {
      throw new Error('NANGO_HOST environment variable is required');
    }
    if (!config.nango.integrationId) {
      throw new Error('NANGO_INTEGRATION_ID environment variable is required');
    }

    this.nango = new Nango({
      host: config.nango.host,
      secretKey: config.nango.apiKey,
    });
  }

  /**
   * Create a connect session for frontend authentication
   */
  async createConnectSession(userId: string, email: string, displayName: string) {
    const { data } = await this.nango.createConnectSession({
      allowed_integrations: [config.nango.integrationId],
      end_user: {
        id: userId,
        email: email,
        display_name: displayName,
      },
    });

    return data;
  }

  /**
   * Create a connect session for CLI authentication (returns connect link)
   */
  async createCLIConnectSession(userId: string, email: string, displayName: string) {
    try {
      console.log('Creating CLI connect session with:', {
        userId,
        email,
        displayName,
        integrationId: config.nango.integrationId,
        host: config.nango.host,
      });

      const response = await this.nango.createConnectSession({
        allowed_integrations: [config.nango.integrationId],
        end_user: {
          id: userId,
          email: email,
          display_name: displayName,
        },
      });

      console.log('Nango connect session response:', {
        hasToken: !!response.data.token,
        hasConnectLink: !!response.data.connect_link,
        tokenLength: response.data.token?.length,
      });

      return {
        connectSessionToken: response.data.token,
        connect_link: response.data.connect_link,
      };
    } catch (error) {
      console.error('Failed to create CLI connect session:', error);
      throw new Error(`Nango connect session failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user data from GitHub using Nango proxy
   */
  async getGitHubUser(connectionId: string): Promise<{
    id: number;
    login: string;
    email: string;
    avatar_url: string;
    name?: string;
  }> {
    const response = await this.nango.proxy({
      providerConfigKey: config.nango.integrationId,
      connectionId: connectionId,
      endpoint: '/user',
    });

    return response.data;
  }

  async getGitHubUserById(userId: string, connectionId: string): Promise<{
    id: number;
    login: string;
    email: string;
    avatar_url: string;
    name?: string;
  }> {
    const response = await this.nango.proxy({
      providerConfigKey: config.nango.integrationId,
      connectionId: connectionId,
      endpoint: `/user/${userId}`,
    });

    return response.data;
  }

  /**
   * Get connection details
   */
  async getConnection(connectionId: string) {
    return await this.nango.getConnection(config.nango.integrationId, connectionId);
  }

  /**
   * Get GitHub user data for a user by their user ID (requires connection ID in database)
   */
  async getGitHubUserByUserId(userId: string, connectionId: string): Promise<{
    id: number;
    login: string;
    email?: string;
    avatar_url: string;
    name?: string;
  }> {
    return await this.getGitHubUser(connectionId);
  }

  /**
   * Get GitHub user emails for a user by their user ID (requires connection ID in database)
   */
  async getGitHubUserEmailByUserId(userId: string, connectionId: string): Promise<{
    id: number;
    login: string;
    email: string;
    avatar_url: string;
  }> {
    return await this.getGitHubUserById(userId, connectionId);
  }
}

// Lazy initialization to avoid errors during module load
let _nangoService: NangoService | null = null;

function getNangoService(): NangoService {
  if (!_nangoService) {
    _nangoService = new NangoService();
  }
  return _nangoService;
}

export const nangoService = {
  async createConnectSession(userId: string, email: string, displayName: string) {
    return getNangoService().createConnectSession(userId, email, displayName);
  },
  
  async createCLIConnectSession(userId: string, email: string, displayName: string) {
    return getNangoService().createCLIConnectSession(userId, email, displayName);
  },
  
  async getGitHubUser(connectionId: string) {
    return getNangoService().getGitHubUser(connectionId);
  },
  
  async getConnection(connectionId: string) {
    return getNangoService().getConnection(connectionId);
  },
  
  async getGitHubUserByUserId(userId: string, connectionId: string) {
    return getNangoService().getGitHubUserByUserId(userId, connectionId);
  },
  
  async getGitHubUserEmailByUserId(userId: string, connectionId: string) {
    return getNangoService().getGitHubUserEmailByUserId(userId, connectionId);
  }
};
