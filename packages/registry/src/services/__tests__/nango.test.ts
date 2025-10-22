/**
 * Tests for Nango service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NangoService } from '../nango.js';

// Mock the Nango SDK
vi.mock('@nangohq/node', () => ({
  Nango: vi.fn().mockImplementation(() => ({
    createConnectSession: vi.fn(),
    proxy: vi.fn(),
    getConnection: vi.fn(),
  })),
}));

// Mock config
vi.mock('../../config.js', () => ({
  config: {
    nango: {
      apiKey: 'test-api-key',
      host: 'https://api.nango.dev',
      integrationId: 'github',
    },
  },
}));

describe('NangoService', () => {
  let nangoService: NangoService;
  let mockNango: any;

  beforeEach(() => {
    vi.clearAllMocks();
    nangoService = new NangoService();
    mockNango = (nangoService as any).nango;
  });

  describe('createConnectSession', () => {
    it('should create a connect session with correct parameters', async () => {
      const mockResponse = {
        data: {
          connectSessionToken: 'test-session-token',
        },
      };

      mockNango.createConnectSession.mockResolvedValue(mockResponse);

      const result = await nangoService.createConnectSession(
        'user123',
        'test@example.com',
        'Test User'
      );

      expect(mockNango.createConnectSession).toHaveBeenCalledWith({
        allowed_integrations: ['github'],
        end_user: {
          id: 'user123',
          email: 'test@example.com',
          display_name: 'Test User',
        },
      });

      expect(result).toEqual({
        connectSessionToken: 'test-session-token',
      });
    });
  });

  describe('getGitHubUser', () => {
    it('should fetch GitHub user data via Nango proxy', async () => {
      const mockUserData = {
        id: 12345,
        login: 'testuser',
        email: 'test@example.com',
        avatar_url: 'https://github.com/avatar.png',
        name: 'Test User',
      };

      mockNango.proxy.mockResolvedValue({
        data: mockUserData,
      });

      const result = await nangoService.getGitHubUser('connection123');

      expect(mockNango.proxy).toHaveBeenCalledWith({
        providerConfigKey: 'github',
        connectionId: 'connection123',
        endpoint: '/user',
      });

      expect(result).toEqual(mockUserData);
    });
  });

  describe('getGitHubUserEmails', () => {
    it('should fetch GitHub user emails via Nango proxy', async () => {
      const mockEmail = {
          id: 1,
          login: 'mockuser',
          email: 'test@example.com',
          avatar_url: 'https://foo.com',
          name: 'Yolo User'
        };

      mockNango.proxy.mockResolvedValue({
        data: mockEmail,
      });

      const result = await nangoService.getGitHubUserEmailByUserId('abc', 'connection123');

      expect(mockNango.proxy).toHaveBeenCalledWith({
        providerConfigKey: 'github',
        connectionId: 'connection123',
        endpoint: '/user/abc',
      });

      expect(result).toEqual(mockEmail);
    });
  });

  describe('getConnection', () => {
    it('should get connection details', async () => {
      const mockConnection = {
        id: 'connection123',
        provider: 'github',
        status: 'active',
      };

      mockNango.getConnection.mockResolvedValue(mockConnection);

      const result = await nangoService.getConnection('connection123');

      expect(mockNango.getConnection).toHaveBeenCalledWith('github', 'connection123');
      expect(result).toEqual(mockConnection);
    });
  });
});
