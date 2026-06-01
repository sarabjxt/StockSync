# StockSync

StockSync is a modern inventory and stock management application. This repository is structured as a [Turborepo](https://turbo.build/) monorepo.

## Project Structure

This monorepo includes the following applications and packages:

### Apps

- **`web`**: The main frontend web application built with [Vite](https://vitejs.dev/) and [TanStack Start](https://tanstack.com/start/latest).
- **`api`**: The backend API application.

### Packages

- **`@stocksync/auth`**: Authentication logic and utilities using [Better Auth](https://better-auth.com/).
- **`@stocksync/db`**: Database schema and ORM using [Drizzle](https://orm.drizzle.team/).
- **`@stocksync/trpc`**: [tRPC](https://trpc.io/) router definitions and context.
- **`@stocksync/ui`**: Shared React UI component library built with [shadcn/ui](https://ui.shadcn.com/) and [Tailwind CSS](https://tailwindcss.com/).
- **`@stocksync/transactional`**: Transactional email templates using [Resend](https://resend.com/).
- **`@stocksync/eslint-config`**: Shared `eslint` configurations.
- **`@stocksync/typescript-config`**: Shared `tsconfig.json`s used throughout the monorepo.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (v8+)

### Installation

Install all dependencies from the root directory using pnpm:

```sh
pnpm install
```

### Environment Variables

Each application and package might require specific environment variables. Create a `.env` file in the respective directories (e.g., `apps/api/.env`, `packages/db/.env`, `packages/auth/.env`) based on their requirements.

### Development

To start the development servers for all apps and packages, run:

```sh
pnpm dev
```

To run a specific application (e.g., the web app):

```sh
pnpm turbo dev --filter=web
```

### Building

To build all apps and packages:

```sh
pnpm build
```

## Tooling

This repository uses the following tools:

- **[TypeScript](https://www.typescriptlang.org/)** for static type checking
- **[ESLint](https://eslint.org/)** for code linting
- **[Prettier](https://prettier.io)** for code formatting
- **[Turborepo](https://turbo.build/)** for intelligent build caching and monorepo management
