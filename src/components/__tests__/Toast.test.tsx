/**
 * Tests for Toast Component
 * Tests toast notification rendering with different types and themes
 */

import { render, screen } from '@testing-library/react';
import { Toast } from '../Toast';
import * as context from '@/context';

// Mock the useTheme hook
vi.mock('@/context', async () => {
  const actual = await vi.importActual('@/context');
  return {
    ...actual,
    useTheme: vi.fn(),
  };
});

describe('Toast', () => {
  const mockUseTheme = vi.mocked(context.useTheme);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockThemeValue: any = {
    isDarkMode: false,
    setIsDarkMode: vi.fn(),
    toggleDarkMode: vi.fn(),
    themeColors: {
      panelBg: '#ffffff',
      borderColor: '#e5e7eb',
      textColor: '#1f2937',
      textSecondary: '#6b7280',
    },
    colors: {
      inputBg: '#f9fafb',
      inputBorder: '#d1d5db',
      hoverBg: '#f3f4f6',
    },
  };

  describe('Rendering', () => {
    it('should render toast with message', () => {
      mockUseTheme.mockReturnValue(mockThemeValue);

      render(<Toast message="Test notification" type="success" />);

      expect(screen.getByText('Test notification')).toBeInTheDocument();
    });

    it('should render success toast in light mode', () => {
      mockUseTheme.mockReturnValue(mockThemeValue);

      const { container } = render(<Toast message="Success!" type="success" />);

      // Verify toast is rendered with message
      expect(screen.getByText('Success!')).toBeInTheDocument();

      // Verify the div element is present (CSS modules will handle styling)
      const toast = container.firstChild;
      expect(toast).toBeInTheDocument();
    });

    it('should render success toast in dark mode', () => {
      mockUseTheme.mockReturnValue({
        ...mockThemeValue,
        isDarkMode: true,
      });

      const { container } = render(<Toast message="Success!" type="success" />);

      // Verify toast is rendered with message
      expect(screen.getByText('Success!')).toBeInTheDocument();

      // Verify the div element is present (dark mode styling handled by CSS modules)
      const toast = container.firstChild;
      expect(toast).toBeInTheDocument();
    });

    it('should render error toast in light mode', () => {
      mockUseTheme.mockReturnValue(mockThemeValue);

      const { container } = render(<Toast message="Error occurred" type="error" />);

      // Verify toast is rendered with message
      expect(screen.getByText('Error occurred')).toBeInTheDocument();

      // Verify the div element is present
      const toast = container.firstChild;
      expect(toast).toBeInTheDocument();
    });

    it('should render error toast in dark mode', () => {
      mockUseTheme.mockReturnValue({
        ...mockThemeValue,
        isDarkMode: true,
      });

      const { container } = render(<Toast message="Error occurred" type="error" />);

      // Verify toast is rendered with message
      expect(screen.getByText('Error occurred')).toBeInTheDocument();

      // Verify the div element is present
      const toast = container.firstChild;
      expect(toast).toBeInTheDocument();
    });
  });

  describe('Message Content', () => {
    it('should display short messages correctly', () => {
      mockUseTheme.mockReturnValue(mockThemeValue);

      render(<Toast message="OK" type="success" />);

      expect(screen.getByText('OK')).toBeInTheDocument();
    });

    it('should display long messages correctly', () => {
      mockUseTheme.mockReturnValue(mockThemeValue);

      const longMessage =
        'This is a very long error message that describes in detail what went wrong during the operation.';

      render(<Toast message={longMessage} type="error" />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should display messages with special characters', () => {
      mockUseTheme.mockReturnValue(mockThemeValue);

      const specialMessage = 'Entity "Account" saved successfully! 🎉';

      render(<Toast message={specialMessage} type="success" />);

      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('should call useTheme hook to get isDarkMode', () => {
      mockUseTheme.mockReturnValue(mockThemeValue);

      render(<Toast message="Test" type="success" />);

      expect(mockUseTheme).toHaveBeenCalled();
    });

    it('should react to theme changes', () => {
      mockUseTheme.mockReturnValue(mockThemeValue);

      const { rerender } = render(<Toast message="Test" type="success" />);

      // Verify component renders with light mode
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(mockUseTheme).toHaveBeenCalledTimes(1);

      // Change to dark mode
      mockUseTheme.mockReturnValue({
        ...mockThemeValue,
        isDarkMode: true,
      });

      rerender(<Toast message="Test" type="success" />);

      // Verify component re-renders with dark mode
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(mockUseTheme).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with proper text content', () => {
      mockUseTheme.mockReturnValue(mockThemeValue);

      render(<Toast message="Accessible notification" type="success" />);

      // Verify message is accessible
      expect(screen.getByText('Accessible notification')).toBeInTheDocument();
    });
  });
});
