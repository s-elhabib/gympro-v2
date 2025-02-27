# GymPro React Project Guide

## Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint on all files
- `npm run preview`: Preview production build

## Code Style Guidelines

### TypeScript
- Use strict typing with interfaces for props and state
- Avoid `any` type; use proper type definitions
- Enable strict mode and no unused locals/parameters

### Imports/Exports
- Use named exports for components
- Group imports: React first, then external libraries, then internal modules
- Use absolute imports with `@/*` path alias for project files

### Component Structure
- Use functional components with React hooks
- Define interfaces for props at the top of files
- Use React.FC type for functional components
- Use React.lazy for route-level code splitting

### Naming Conventions
- PascalCase for components and interfaces
- camelCase for variables, functions, and instances
- Use descriptive, semantic naming

### Formatting
- Use ES modules (`type: "module"`)
- Target ES2020 for compatibility
- Use tailwindcss for styling

### Error Handling
- Use proper error boundaries and loading states
- Provide fallbacks for async operations
- Handle form validation with zod and react-hook-form