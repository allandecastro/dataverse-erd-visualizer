/**
 * Shared constants for ERD Visualizer components
 */

// Entity card dimensions
export const CARD_WIDTH = 300;
export const HEADER_HEIGHT = 60;
export const SUBHEADER_HEIGHT = 24;
export const ATTRIBUTES_TITLE_HEIGHT = 30;
export const FIELD_ROW_HEIGHT = 28;
export const FIELD_HEIGHT = 44;
export const FIELD_HALF_HEIGHT = 22;
export const FIELD_PADDING_TOP = 8;

// Cardinality symbol mappings for relationship display
export const CARDINALITY_SYMBOLS: Record<string, { from: string; to: string }> = {
  'N:1': { from: 'N', to: '1' },
  '1:N': { from: '1', to: 'N' },
  'N:N': { from: 'N', to: 'N' },
};

// SVG Logo as data URL (for Dataverse web resource compatibility)
export const LOGO_DATA_URL = `data:image/svg+xml,${encodeURIComponent(`<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="dvGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:rgb(236, 72, 153)"/><stop offset="100%" style="stop-color:rgb(139, 92, 246)"/></linearGradient><clipPath id="logoClip"><rect x="0" y="0" width="400" height="400" rx="40"/></clipPath></defs><g clip-path="url(#logoClip)"><rect x="0" y="0" width="400" height="400" rx="40" fill="url(#dvGrad)"/><rect x="60" y="60" width="100" height="80" rx="8" fill="#ffffff"/><rect x="60" y="60" width="100" height="24" rx="8" fill="#1e1b4b"/><line x1="70" y1="98" x2="140" y2="98" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><line x1="70" y1="114" x2="130" y2="114" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><line x1="70" y1="130" x2="120" y2="130" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><rect x="240" y="60" width="100" height="80" rx="8" fill="#ffffff"/><rect x="240" y="60" width="100" height="24" rx="8" fill="#1e1b4b"/><line x1="250" y1="98" x2="320" y2="98" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><line x1="250" y1="114" x2="310" y2="114" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><line x1="250" y1="130" x2="300" y2="130" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><rect x="150" y="200" width="100" height="80" rx="8" fill="#ffffff"/><rect x="150" y="200" width="100" height="24" rx="8" fill="#1e1b4b"/><line x1="160" y1="238" x2="230" y2="238" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><line x1="160" y1="254" x2="220" y2="254" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><line x1="160" y1="270" x2="210" y2="270" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><path d="M 160 100 L 240 100" stroke="#fbbf24" stroke-width="4" fill="none"/><path d="M 110 140 L 110 170 L 175 200" stroke="#fbbf24" stroke-width="4" fill="none"/><path d="M 290 140 L 290 170 L 225 200" stroke="#fbbf24" stroke-width="4" fill="none"/><circle cx="160" cy="100" r="6" fill="#fbbf24"/><circle cx="240" cy="100" r="6" fill="#fbbf24"/><circle cx="110" cy="140" r="6" fill="#fbbf24"/><circle cx="175" cy="200" r="6" fill="#fbbf24"/><circle cx="290" cy="140" r="6" fill="#fbbf24"/><circle cx="225" cy="200" r="6" fill="#fbbf24"/></g></svg>`)}`;
