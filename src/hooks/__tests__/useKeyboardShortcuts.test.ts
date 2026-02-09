/**
 * Tests for Keyboard Shortcuts Hook
 * Tests keyboard event handling for ERD navigation shortcuts
 */

import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts, getKeyboardShortcuts } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  const mockCallbacks = {
    onSelectAll: vi.fn(),
    onDeselectAll: vi.fn(),
    onOpenSearch: vi.fn(),
    onSaveSnapshot: vi.fn(),
    onOpenSnapshots: vi.fn(),
    onShareURL: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Keyboard Event Handling', () => {
    it('should call onSelectAll when Ctrl+A is pressed', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, bubbles: true });
      window.dispatchEvent(event);

      expect(mockCallbacks.onSelectAll).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.onDeselectAll).not.toHaveBeenCalled();
    });

    it('should call onSelectAll when Cmd+A is pressed (Mac)', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      const event = new KeyboardEvent('keydown', { key: 'a', metaKey: true, bubbles: true });
      window.dispatchEvent(event);

      expect(mockCallbacks.onSelectAll).toHaveBeenCalledTimes(1);
    });

    it('should call onDeselectAll when Escape is pressed', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      window.dispatchEvent(event);

      expect(mockCallbacks.onDeselectAll).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.onSelectAll).not.toHaveBeenCalled();
    });

    it('should call onOpenSearch when / is pressed', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      const event = new KeyboardEvent('keydown', { key: '/', bubbles: true });
      window.dispatchEvent(event);

      expect(mockCallbacks.onOpenSearch).toHaveBeenCalledTimes(1);
    });

    it('should NOT call onOpenSearch when Ctrl+/ is pressed', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      const event = new KeyboardEvent('keydown', { key: '/', ctrlKey: true, bubbles: true });
      window.dispatchEvent(event);

      expect(mockCallbacks.onOpenSearch).not.toHaveBeenCalled();
    });

    it('should call onSaveSnapshot when Ctrl+S is pressed', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true });
      window.dispatchEvent(event);

      expect(mockCallbacks.onSaveSnapshot).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.onOpenSnapshots).not.toHaveBeenCalled();
    });

    it('should call onOpenSnapshots when Ctrl+Shift+S is pressed', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(mockCallbacks.onOpenSnapshots).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.onSaveSnapshot).not.toHaveBeenCalled();
    });

    it('should call onShareURL when Ctrl+Shift+C is pressed', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      const event = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(mockCallbacks.onShareURL).toHaveBeenCalledTimes(1);
    });

    it('should handle uppercase key presses correctly', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      // Uppercase 'A' with Ctrl
      const eventA = new KeyboardEvent('keydown', { key: 'A', ctrlKey: true, bubbles: true });
      window.dispatchEvent(eventA);

      // Uppercase 'S' with Ctrl
      const eventS = new KeyboardEvent('keydown', { key: 'S', ctrlKey: true, bubbles: true });
      window.dispatchEvent(eventS);

      // Uppercase 'C' with Ctrl+Shift
      const eventC = new KeyboardEvent('keydown', {
        key: 'C',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(eventC);

      expect(mockCallbacks.onSelectAll).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.onSaveSnapshot).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.onShareURL).toHaveBeenCalledTimes(1);
    });
  });

  describe('Input Prevention Logic', () => {
    it('should NOT trigger shortcuts when typing in input fields', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      const input = document.createElement('input');
      document.body.appendChild(input);

      const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, bubbles: true });
      Object.defineProperty(event, 'target', { value: input, writable: false });
      window.dispatchEvent(event);

      expect(mockCallbacks.onSelectAll).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should NOT trigger shortcuts when typing in textarea fields', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      const event = new KeyboardEvent('keydown', { key: '/', bubbles: true });
      Object.defineProperty(event, 'target', { value: textarea, writable: false });
      window.dispatchEvent(event);

      expect(mockCallbacks.onOpenSearch).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it('should NOT trigger shortcuts in contentEditable elements', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      const div = document.createElement('div');
      div.setAttribute('contenteditable', 'true');
      // Manually set isContentEditable to true for the test
      Object.defineProperty(div, 'isContentEditable', { value: true, writable: false });
      document.body.appendChild(div);

      const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true });
      Object.defineProperty(event, 'target', { value: div, writable: false });
      window.dispatchEvent(event);

      expect(mockCallbacks.onSaveSnapshot).not.toHaveBeenCalled();

      document.body.removeChild(div);
    });

    it('should STILL trigger Escape even when in input fields', () => {
      renderHook(() => useKeyboardShortcuts(mockCallbacks));

      const input = document.createElement('input');
      document.body.appendChild(input);

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      Object.defineProperty(event, 'target', { value: input, writable: false });
      window.dispatchEvent(event);

      expect(mockCallbacks.onDeselectAll).toHaveBeenCalledTimes(1);

      document.body.removeChild(input);
    });
  });

  describe('Enabled/Disabled State', () => {
    it('should attach event listener when enabled=true', () => {
      renderHook(() => useKeyboardShortcuts({ ...mockCallbacks, enabled: true }));

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      window.dispatchEvent(event);

      expect(mockCallbacks.onDeselectAll).toHaveBeenCalledTimes(1);
    });

    it('should NOT attach event listener when enabled=false', () => {
      renderHook(() => useKeyboardShortcuts({ ...mockCallbacks, enabled: false }));

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      window.dispatchEvent(event);

      expect(mockCallbacks.onDeselectAll).not.toHaveBeenCalled();
    });

    it('should default to enabled=true when not specified', () => {
      const callbacks = {
        onSelectAll: vi.fn(),
        onDeselectAll: vi.fn(),
        onOpenSearch: vi.fn(),
      };

      renderHook(() => useKeyboardShortcuts(callbacks));

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      window.dispatchEvent(event);

      expect(callbacks.onDeselectAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('Optional Callbacks', () => {
    it('should NOT call onSaveSnapshot if not provided', () => {
      const callbacks = {
        onSelectAll: vi.fn(),
        onDeselectAll: vi.fn(),
        onOpenSearch: vi.fn(),
        // No onSaveSnapshot provided
      };

      renderHook(() => useKeyboardShortcuts(callbacks));

      const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true });
      window.dispatchEvent(event);

      // Should not throw, just do nothing
      expect(callbacks.onSelectAll).not.toHaveBeenCalled();
    });

    it('should NOT call onOpenSnapshots if not provided', () => {
      const callbacks = {
        onSelectAll: vi.fn(),
        onDeselectAll: vi.fn(),
        onOpenSearch: vi.fn(),
        // No onOpenSnapshots provided
      };

      renderHook(() => useKeyboardShortcuts(callbacks));

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Should not throw, just do nothing
      expect(callbacks.onSelectAll).not.toHaveBeenCalled();
    });

    it('should NOT call onShareURL if not provided', () => {
      const callbacks = {
        onSelectAll: vi.fn(),
        onDeselectAll: vi.fn(),
        onOpenSearch: vi.fn(),
        // No onShareURL provided
      };

      renderHook(() => useKeyboardShortcuts(callbacks));

      const event = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Should not throw, just do nothing
      expect(callbacks.onSelectAll).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should remove event listener on unmount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useKeyboardShortcuts(mockCallbacks));

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });
});

describe('getKeyboardShortcuts', () => {
  it('should return array of keyboard shortcuts', () => {
    const shortcuts = getKeyboardShortcuts();

    expect(Array.isArray(shortcuts)).toBe(true);
    expect(shortcuts.length).toBeGreaterThan(0);
  });

  it('should include all expected shortcuts', () => {
    const shortcuts = getKeyboardShortcuts();

    const keys = shortcuts.map((s) => s.key);

    expect(keys).toContain('Ctrl+A');
    expect(keys).toContain('Esc');
    expect(keys).toContain('/');
    expect(keys).toContain('Ctrl+S');
    expect(keys).toContain('Ctrl+Shift+S');
    expect(keys).toContain('Ctrl+Shift+C');
  });

  it('should provide descriptions for all shortcuts', () => {
    const shortcuts = getKeyboardShortcuts();

    shortcuts.forEach((shortcut) => {
      expect(shortcut.key).toBeDefined();
      expect(shortcut.description).toBeDefined();
      expect(typeof shortcut.key).toBe('string');
      expect(typeof shortcut.description).toBe('string');
      expect(shortcut.description.length).toBeGreaterThan(0);
    });
  });
});
