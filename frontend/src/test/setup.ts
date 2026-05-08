import '@testing-library/jest-dom/vitest';

// Polyfill ResizeObserver for jsdom (required by antd components)
if (typeof ResizeObserver === 'undefined') {
  (window as any).ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Polyfill matchMedia for jsdom (required by antd)
if (typeof window.matchMedia === 'undefined') {
  (window as any).matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
