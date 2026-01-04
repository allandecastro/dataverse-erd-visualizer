# Dataverse ERD Visualizer - TODO List

## Lint Warnings to Fix (11 total)

### React Hooks
- [ ] **DraggableEdge.tsx:41** - Wrap `savedOffset` initialization in `useMemo()` to fix useCallback dependencies

### React Refresh (Fast Refresh)
- [ ] **ThemeContext.tsx:134,146** - Move `useTheme` and `useThemeColors` hooks to separate file for fast refresh compatibility
- [ ] **main.tsx:10** - Move `Root` component to separate file (e.g., `Root.tsx`)

### TypeScript `any` Types
- [ ] **dataverseApi.ts:315** - Replace `any` with proper type
- [ ] **dataverseApi.ts:474** - Replace `any` with proper type
- [ ] **dataverseApi.ts:521** - Replace `any` with proper type
- [ ] **types/index.ts:183,187** - Replace `any` in Xrm WebApi types with proper types

### Console Statements
- [ ] **dataverseApi.ts:215** - Replace `console.log` with `console.warn` or `console.error`

---

## Code Quality Improvements

### CSS Module Extraction
Extract inline styles to CSS modules for these components:
- [ ] **Sidebar.tsx** - Large component with many inline styles
- [ ] **SidebarHeader.tsx**
- [ ] **SidebarSettings.tsx**
- [ ] **SidebarFilters.tsx**
- [ ] **SidebarLegend.tsx**
- [ ] **Toolbar.tsx**
- [ ] **FeatureGuide.tsx** - Modal with extensive styling
- [ ] **ReactFlowERD.tsx**
- [ ] **TableNode.tsx**
- [ ] **AddRelatedTableDialog.tsx**
- [ ] **Toast.tsx**

### ThemeContext Integration
Extend `useTheme()` hook usage to reduce prop drilling:
- [ ] **Sidebar.tsx** - Use `useTheme()` instead of props
- [ ] **Toolbar.tsx** - Use `useTheme()` instead of props
- [ ] **Toast.tsx** - Use `useTheme()` instead of props
- [ ] **FeatureGuide.tsx** - Use `useTheme()` instead of props
- [ ] **EntitySearch.tsx** - Use `useTheme()` instead of props
- [ ] **FieldDrawer.tsx** - Use `useTheme()` instead of props

### Performance Optimizations
- [ ] Add `React.memo` to remaining components that receive stable props
- [ ] Review `useMemo`/`useCallback` usage in hooks for optimization opportunities
- [ ] Consider virtualizing the entity list in Sidebar for large datasets

### Type Safety
- [ ] Replace index signatures `[key: string]: unknown` with explicit properties in:
  - [ ] **DraggableEdge.tsx:24**
  - [ ] **TableNode.tsx:18**
- [ ] Sync `ToolbarProps` type in `types/erdTypes.ts` with actual implementation

---

## Testing

### Unit Tests
- [ ] Set up testing framework (Vitest recommended for Vite projects)
- [ ] Add tests for utility functions in `utils/`
- [ ] Add tests for hooks in `hooks/`
- [ ] Add component tests for critical UI components

### E2E Tests
- [ ] Set up Playwright or Cypress
- [ ] Add basic navigation tests
- [ ] Add export functionality tests

---

## Documentation

- [ ] Add JSDoc comments to complex functions in:
  - [ ] `DraggableEdge.tsx` - `getPathWithOffset()` algorithm
  - [ ] `SelfReferenceEdge.tsx` - Path calculation
  - [ ] `ReactFlowERD.tsx` - Edge type selection logic
  - [ ] `useLayoutAlgorithms.ts` - Layout algorithm documentation
- [ ] Update README with new folder structure
- [ ] Add architecture documentation

---

## Bundle Optimization

- [ ] Analyze bundle with `npx vite-bundle-visualizer`
- [ ] Check for tree-shaking opportunities
- [ ] Consider lazy loading more components
- [ ] Evaluate if lucide-react icons can be individually imported

---

## Accessibility

- [ ] Add keyboard navigation for entity cards
- [ ] Ensure all interactive elements have focus indicators
- [ ] Add skip links for screen reader users
- [ ] Test with screen reader (NVDA/VoiceOver)

---

## Future Features

- [ ] Undo/Redo for position changes
- [ ] Save/Load diagram layouts
- [ ] Entity grouping/clustering
- [ ] Relationship filtering
- [ ] Print-friendly view
- [ ] Zoom to selection

---

## Commands Reference

```bash
# Run linter
npm run lint

# Fix auto-fixable lint issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting
npm run format:check

# Build for production
npm run build

# Run development server
npm run dev
```
