/**
 * Mock for node-fetch to avoid actual HTTP requests in tests
 */
declare const _default: jest.Mock<any, any, any>;
export default _default;
export declare const mockFetchSuccess: (content: string) => void;
export declare const mockFetchError: (status: number, statusText: string) => void;
export declare const mockFetchNetworkError: (error: Error) => void;
//# sourceMappingURL=node-fetch.d.ts.map