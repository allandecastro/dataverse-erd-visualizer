# Contributing to Dataverse ERD Visualizer

First off, thank you for considering contributing to Dataverse ERD Visualizer! It's people like you that make this tool better for the Power Platform community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please be respectful, inclusive, and considerate in all interactions.

**Our Standards:**
- Be welcoming and inclusive
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community

---

## Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **npm** or **yarn**
- **Git**
- A code editor (VS Code recommended)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/dataverse-erd-visualizer.git
cd dataverse-erd-visualizer
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/allandecastro/dataverse-erd-visualizer.git
```

---

## Development Setup

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The app runs at `http://localhost:3000` with mock data - no Dataverse connection required!

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run build:webresource` | Build for Dataverse web resource |
| `npm run preview` | Preview production build locally |

### Testing with Mock Data

The development server automatically uses mock data. You'll see a "MOCK MODE" banner.

To force mock mode: `http://localhost:3000?mock=true`

---

## Project Structure

```
src/
├── components/
│   └── ERDVisualizer/          # Main ERD component
│       ├── components/         # UI sub-components
│       │   ├── CanvasERD.tsx       # High-performance canvas mode
│       │   ├── EntityCard.tsx      # Entity table cards
│       │   ├── Sidebar.tsx         # Filter panel
│       │   ├── Toolbar.tsx         # Action bar
│       │   └── ...
│       ├── hooks/              # Custom React hooks
│       │   ├── useERDState.ts      # Main state management
│       │   ├── useViewport.ts      # Viewport culling
│       │   └── ...
│       └── utils/              # Utility functions
│           ├── exportUtils.ts      # Export functions
│           └── drawioExport.ts     # Draw.io export
├── hooks/
│   └── useDataverseData.ts     # Dataverse API integration
├── services/
│   ├── dataverseApi.ts         # Dataverse Web API client
│   └── mockData.ts             # Mock data for development
└── types/
    └── index.ts                # TypeScript type definitions
```

---

## Making Changes

### Create a Branch

Always create a branch for your changes:

```bash
# Sync with upstream first
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

### Branch Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/description` | `feature/add-export-csv` |
| Bug fix | `fix/description` | `fix/relationship-lines` |
| Docs | `docs/description` | `docs/update-readme` |
| Refactor | `refactor/description` | `refactor/hook-cleanup` |

### Keep Your Branch Updated

```bash
git fetch upstream
git rebase upstream/main
```

---

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type when possible
- Export types from `src/types/index.ts`

```typescript
// Good
interface EntityCardProps {
  entity: Entity;
  isSelected: boolean;
  onClick: (id: string) => void;
}

// Avoid
const handleClick = (data: any) => { ... }
```

### React Components

- Use functional components with hooks
- Use `React.memo` for performance-critical components
- Keep components focused and single-purpose
- Use inline styles (project convention)

```tsx
// Component template
import { memo } from 'react';

interface Props {
  // ...
}

export const MyComponent = memo(function MyComponent({ ...props }: Props) {
  return (
    <div style={{ /* inline styles */ }}>
      {/* content */}
    </div>
  );
});
```

### Hooks

- Prefix custom hooks with `use`
- Keep hooks in `hooks/` directories
- Document complex hooks with comments

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `EntityCard.tsx` |
| Hooks | camelCase with `use` prefix | `useViewport.ts` |
| Utils | camelCase | `exportUtils.ts` |
| Types | camelCase | `index.ts` |

---

## Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change without feature/fix |
| `perf` | Performance improvement |
| `test` | Adding tests |
| `chore` | Maintenance tasks |

### Examples

```bash
feat(export): add CSV export option
fix(canvas): resolve rendering issue on zoom
docs(readme): update installation instructions
refactor(hooks): simplify useViewport logic
```

---

## Pull Request Process

### Before Submitting

1. **Test your changes** - Ensure the app works correctly
2. **Build succeeds** - Run `npm run build`
3. **Update documentation** - If needed
4. **Rebase on main** - Keep history clean

### Creating the PR

1. Push your branch to your fork:

```bash
git push origin feature/your-feature-name
```

2. Open a Pull Request on GitHub
3. Fill in the PR template with:
   - Clear description of changes
   - Related issues (if any)
   - Screenshots (for UI changes)

### PR Title Format

Use the same format as commit messages:

```
feat(export): add CSV export option
```

### Review Process

- All PRs require at least one review
- Address feedback promptly
- Keep discussions constructive
- Squash commits if requested

---

## Reporting Bugs

### Before Reporting

1. Check existing [issues](https://github.com/allandecastro/dataverse-erd-visualizer/issues)
2. Try the latest version
3. Reproduce in a clean environment

### Bug Report Template

```markdown
**Describe the bug**
A clear description of the bug.

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- Browser: [e.g., Chrome 120]
- OS: [e.g., Windows 11]
- Version: [e.g., 0.1.0]
```

---

## Suggesting Features

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Any other context or screenshots.
```

---

## Questions?

- Open a [Discussion](https://github.com/allandecastro/dataverse-erd-visualizer/discussions)
- Check existing issues and discussions first

---

Thank you for contributing!
