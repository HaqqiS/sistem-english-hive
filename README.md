# Sistema English Hive

A modern Management System for English Hive, built with the T3 Stack.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma](https://www.prisma.io/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Validation**: [Zod](https://zod.dev/)
- **Forms**: [React Hook Form](https://react-hook-form.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Linting/Formatting**: [Biome](https://biomejs.dev/)

## Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [pnpm](https://pnpm.io/) (PackageManager)

## Getting Started

1.  **Clone the repository**
    ```bash
    git clone <repository_url>
    cd sistem_english_hive
    ```

2.  **Install dependencies**
    ```bash
    pnpm install
    ```

3.  **Environment Setup**
    Create a `.env` file based on `.env.example`:
    ```bash
    cp .env.example .env
    ```
    Update the database URL and other secrets in `.env`.

4.  **Database Setup**
    ```bash
    # Push schema to database
    pnpm db:push
    
    # (Optional) Seed the database
    pnpm prisma db seed
    ```

5.  **Run Development Server**
    ```bash
    pnpm dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser.

## Scripts

- `pnpm dev`: Run development server
- `pnpm build`: Build for production
- `pnpm start`: Start production server
- `pnpm check`: Run Biome lint & format check
- `pnpm format`: Fix Biome lint & format issues
- `pnpm typecheck`: Run TypeScript type checking
- `pnpm db:studio`: Open Prisma Studio to view data

## Project Structure

- `src/app`: App Router pages and layouts
- `src/server`: Backend logic (tRPC/Server Actions/API)
- `src/components`: UI components
- `src/lib`: Utilities and libraries configuration
- `prisma`: Database schema and seeds
