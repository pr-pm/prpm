/**
 * Mock for node-fetch to avoid actual HTTP requests in tests
 */

export default jest.fn();

// Mock successful response
export const mockFetchSuccess = (content: string) => {
  const mockFetch = require('node-fetch').default as jest.Mock;
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    text: () => Promise.resolve(content)
  });
};

// Mock error response
export const mockFetchError = (status: number, statusText: string) => {
  const mockFetch = require('node-fetch').default as jest.Mock;
  mockFetch.mockResolvedValue({
    ok: false,
    status,
    statusText,
    text: () => Promise.resolve('')
  });
};

// Mock network error
export const mockFetchNetworkError = (error: Error) => {
  const mockFetch = require('node-fetch').default as jest.Mock;
  mockFetch.mockRejectedValue(error);
};
