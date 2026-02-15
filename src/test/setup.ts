import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia (for dark mode tests)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage with proper Storage interface
const localStorageMock: Storage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

// Mock canvas (for exportUtils tests)
const canvasContextMock: Partial<CanvasRenderingContext2D> = {
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
  createImageData: vi.fn() as CanvasRenderingContext2D['createImageData'],
  setTransform: vi.fn(),
  drawImage: vi.fn() as CanvasRenderingContext2D['drawImage'],
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })) as unknown as CanvasRenderingContext2D['measureText'],
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn() as CanvasRenderingContext2D['clip'],
};
HTMLCanvasElement.prototype.getContext = vi.fn(
  () => canvasContextMock
) as unknown as typeof HTMLCanvasElement.prototype.getContext;

// Mock Xrm object (for Dataverse context tests)
vi.stubGlobal('Xrm', {
  Utility: {
    getGlobalContext: vi.fn(() => ({
      getClientUrl: vi.fn(() => 'https://org.crm.dynamics.com'),
    })),
  },
});
