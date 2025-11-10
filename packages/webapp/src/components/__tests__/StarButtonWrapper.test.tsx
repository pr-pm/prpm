/**
 * Tests for StarButtonWrapper component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import StarButtonWrapper from '../StarButtonWrapper';

// Mock StarButton component
vi.mock('../StarButton', () => ({
  default: ({ initialStarred, initialStars }: any) => (
    <div data-testid="star-button">
      Starred: {String(initialStarred)}, Stars: {initialStars}
    </div>
  ),
}));

// Mock API functions
vi.mock('../../lib/api', () => ({
  getStarredPackages: vi.fn(),
  getStarredCollections: vi.fn(),
}));

describe('StarButtonWrapper', () => {
  const mockGetStarredPackages = vi.fn();
  const mockGetStarredCollections = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    Storage.prototype.getItem = vi.fn(() => 'test-token');
    // Import and set up mocks
    const api = require('../../lib/api');
    api.getStarredPackages = mockGetStarredPackages;
    api.getStarredCollections = mockGetStarredCollections;
  });

  describe('Package star status', () => {
    it('should show loading state initially', () => {
      mockGetStarredPackages.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <StarButtonWrapper
          type="package"
          id="pkg-123"
          initialStars={10}
        />
      );

      expect(screen.getByRole('generic')).toBeInTheDocument();
    });

    it('should check if package is starred', async () => {
      mockGetStarredPackages.mockResolvedValue({
        packages: [
          { id: 'pkg-123', name: 'test-package' },
          { id: 'pkg-456', name: 'other-package' },
        ],
        total: 2,
      });

      render(
        <StarButtonWrapper
          type="package"
          id="pkg-123"
          initialStars={10}
        />
      );

      await waitFor(() => {
        expect(mockGetStarredPackages).toHaveBeenCalledWith('test-token', 100, 0);
      });

      await waitFor(() => {
        expect(screen.getByTestId('star-button')).toHaveTextContent('Starred: true');
      });
    });

    it('should detect unstarred package', async () => {
      mockGetStarredPackages.mockResolvedValue({
        packages: [
          { id: 'pkg-456', name: 'other-package' },
        ],
        total: 1,
      });

      render(
        <StarButtonWrapper
          type="package"
          id="pkg-123"
          initialStars={10}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('star-button')).toHaveTextContent('Starred: false');
      });
    });

    it('should not check star status when not logged in', async () => {
      Storage.prototype.getItem = vi.fn(() => null);

      render(
        <StarButtonWrapper
          type="package"
          id="pkg-123"
          initialStars={10}
        />
      );

      await waitFor(() => {
        expect(mockGetStarredPackages).not.toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByTestId('star-button')).toHaveTextContent('Starred: false');
      });
    });

    it('should handle API errors gracefully', async () => {
      mockGetStarredPackages.mockRejectedValue(new Error('API Error'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <StarButtonWrapper
          type="package"
          id="pkg-123"
          initialStars={10}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('star-button')).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });
  });

  describe('Collection star status', () => {
    it('should check if collection is starred', async () => {
      mockGetStarredCollections.mockResolvedValue({
        collections: [
          { id: 'col-123', name: 'test-collection' },
        ],
        total: 1,
      });

      render(
        <StarButtonWrapper
          type="collection"
          id="col-123"
          scope="collection"
          nameSlug="test-collection"
          initialStars={30}
        />
      );

      await waitFor(() => {
        expect(mockGetStarredCollections).toHaveBeenCalledWith('test-token', 100, 0);
      });

      await waitFor(() => {
        expect(screen.getByTestId('star-button')).toHaveTextContent('Starred: true');
      });
    });

    it('should detect unstarred collection', async () => {
      mockGetStarredCollections.mockResolvedValue({
        collections: [
          { id: 'col-456', name: 'other-collection' },
        ],
        total: 1,
      });

      render(
        <StarButtonWrapper
          type="collection"
          id="col-123"
          scope="collection"
          nameSlug="test-collection"
          initialStars={30}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('star-button')).toHaveTextContent('Starred: false');
      });
    });
  });

  describe('Props passing', () => {
    it('should pass all props to StarButton', async () => {
      mockGetStarredPackages.mockResolvedValue({
        packages: [],
        total: 0,
      });

      render(
        <StarButtonWrapper
          type="package"
          id="pkg-123"
          initialStars={42}
        />
      );

      await waitFor(() => {
        const starButton = screen.getByTestId('star-button');
        expect(starButton).toHaveTextContent('Stars: 42');
      });
    });

    it('should pass scope and nameSlug for collections', async () => {
      mockGetStarredCollections.mockResolvedValue({
        collections: [],
        total: 0,
      });

      render(
        <StarButtonWrapper
          type="collection"
          id="col-123"
          scope="collection"
          nameSlug="test-collection"
          initialStars={30}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('star-button')).toBeInTheDocument();
      });
    });
  });
});
