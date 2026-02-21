# Project Overview

This is a web application for conducting team retrospectives. It is built with the TanStack Start framework, which uses React, Vite, and TanStack Router. The application is styled with Tailwind CSS and is designed to be deployed to Cloudflare Workers. The database schema is managed by Supabase and includes tables for users, retro sessions, topics, votes, and surveys.

## Key Technologies

*   **Framework:** [TanStack Start](https://tanstack.com/start)
*   **Language:** TypeScript
*   **UI:** [React](https://react.dev/)
*   **Routing:** [TanStack Router](https://tanstack.com/router)
*   **Bundler:** [Vite](https://vitejs.dev/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Testing:** [Vitest](https://vitest.dev/)
*   **Deployment:** [Cloudflare Workers](https://workers.cloudflare.com/)
*   **Database:** [Supabase](https://supabase.com/)

# Building and Running

## Development

To run the application in development mode:

```bash
pnpm install
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Building for Production

To build the application for production:

```bash
pnpm build
```

## Testing

To run the tests:

```bash
pnpm test
```

# Development Conventions

*   **Routing:** The project uses file-based routing. Routes are managed as files in the `src/routes` directory.
*   **Styling:** Styling is done with Tailwind CSS. The main stylesheet is located at `src/styles.css`.
*   **Database:** The database schema is defined in `supabase/schemas/001_retro_schema.sql`. Migrations are located in `supabase/migrations`.
