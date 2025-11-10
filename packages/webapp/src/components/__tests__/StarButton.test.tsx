/**
 * Tests for StarButton component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StarButton from '../StarButton';

// Mock API functions
vi.mock('../../lib/api', () => ({
  starPackage: vi.fn(),
  starCollection: vi.fn(),
}));

describe('StarButton', () => {
  const mockStarPackage = vi.fn();
  const mockStarCollection = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    Storage.prototype.getItem = vi.fn(() => 'test-token');
    // Import and set up mocks
    const api = require('../../lib/api');
    api.starPackage = mockStarPackage;
    api.starCollection = mockStarCollection;
  });

  describe('Package starring', () => {
    it('should render unstarred state', () => {
      render(
        <StarButton
          type="package"
          id="pkg-123"
          initialStarred={false}
          initialStars={10}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should render starred state', () => {
      render(
        <StarButton
          type="package"
          id="pkg-123"
          initialStarred={true}
          initialStars={11}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(screen.getByText('11')).toBeInTheDocument();
    });

    it('should star a package on click', async () => {
      mockStarPackage.mockResolvedValue({ starred: true, stars: 11 });

      render(
        <StarButton
          type="package"
          id="pkg-123"
          initialStarred={false}
          initialStars={10}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockStarPackage).toHaveBeenCalledWith('test-token', 'pkg-123', true);
      });

      await waitFor(() => {
        expect(screen.getByText('11')).toBeInTheDocument();
      });
    });

    it('should unstar a package on click', async () => {
      mockStarPackage.mockResolvedValue({ starred: false, stars: 9 });

      render(
        <StarButton
          type="package"
          id="pkg-123"
          initialStarred={true}
          initialStars={10}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockStarPackage).toHaveBeenCalledWith('test-token', 'pkg-123', false);
      });

      await waitFor(() => {
        expect(screen.getByText('9')).toBeInTheDocument();
      });
    });

    it('should show error when not logged in', async () => {
      Storage.prototype.getItem = vi.fn(() => null);

      render(
        <StarButton
          type="package"
          id="pkg-123"
          initialStarred={false}
          initialStars={10}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Please log in to star')).toBeInTheDocument();
      });
    });

    it('should handle API errors', async () => {
      mockStarPackage.mockRejectedValue(new Error('API Error'));

      render(
        <StarButton
          type="package"
          id="pkg-123"
          initialStarred={false}
          initialStars={10}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Failed to star')).toBeInTheDocument();
      });
    });

    it('should disable button while loading', async () => {
      mockStarPackage.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ starred: true, stars: 11 }), 100))
      );

      render(
        <StarButton
          type="package"
          id="pkg-123"
          initialStarred={false}
          initialStars={10}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(button).toBeDisabled();

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should call onStarChange callback', async () => {
      mockStarPackage.mockResolvedValue({ starred: true, stars: 11 });
      const onStarChange = vi.fn();

      render(
        <StarButton
          type="package"
          id="pkg-123"
          initialStarred={false}
          initialStars={10}
          onStarChange={onStarChange}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(onStarChange).toHaveBeenCalledWith(true, 11);
      });
    });
  });

  describe('Collection starring', () => {
    it('should star a collection', async () => {
      mockStarCollection.mockResolvedValue({ starred: true, stars: 31 });

      render(
        <StarButton
          type="collection"
          id="col-123"
          scope="collection"
          nameSlug="test-collection"
          initialStarred={false}
          initialStars={30}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockStarCollection).toHaveBeenCalledWith(
          'test-token',
          'collection',
          'test-collection',
          true
        );
      });

      await waitFor(() => {
        expect(screen.getByText('31')).toBeInTheDocument();
      });
    });

    it('should throw error if scope or nameSlug missing', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <StarButton
          type="collection"
          id="col-123"
          initialStarred={false}
          initialStars={30}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/scope and nameSlug are required/)).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels', () => {
      const { rerender } = render(
        <StarButton
          type="package"
          id="pkg-123"
          initialStarred={false}
          initialStars={10}
        />
      );

      let button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Star');

      rerender(
        <StarButton
          type="package"
          id="pkg-123"
          initialStarred={true}
          initialStars={11}
        />
      );

      button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Unstar');
    });
  });
});
