# Sistem English Hive

A modern, high-performance Management System for **English Hive**, engineered with the **T3 Stack** for maximum type-safety and developer productivity.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.5-2D3748?logo=prisma)](https://www.prisma.io/)
[![tRPC](https://img.shields.io/badge/tRPC-11-2596be?logo=trpc)](https://trpc.io/)

---

## ✨ Features

### 🔐 Multi-Role Access Control
- **Admin Dashboard**: Full control over the system, branches, and academic records.
- **Teacher (Guru) Portal**: Dedicated workspace for attendance, schedules, and class management.

### 🏢 Administrative Management
- **Academic Core**: Manage classes (`Kelas`), class types (`Jenis Kelas`), and schedules (`Jam`).
- **Resource Management**: Track branches (`Cabang`), rooms (`Ruang`), and textbooks (`Buku`).
- **User Directory**: Unified management for students (`Murid`) and teachers (`Guru`).
- **Financial Tracking**: Integrated payment tracking system (`Pembayaran`).

### 👩‍🏫 Teacher Workflow
- **Digital Attendance**: Streamlined student attendance tracking (`Absen`).
- **Schedule Management**: Personal class schedules and session updates.
- **Profile Management**: Personalized teacher profiles and credentials.

### 🛠️ Technical Excellence
- **End-to-End Type Safety**: Powered by tRPC and Zod.
- **Modern UI**: Crafted with Shadcn UI and Radix UI primitives.
- **Responsive Design**: Mobile-first approach using Tailwind CSS 4.
- **Quality Assurance**: Enforced by Biome (linting), TypeScript (type checking), and Vitest (unit testing).

---

## 🏗️ Project Structure

```text
.
├── prisma/                  # Database schema & migrations
│   ├── migrations/          # SQL migration history
│   └── seedMurid.ts         # Database seeding script
├── public/                  # Static assets (images, icons)
├── src/
│   ├── app/                 # Next.js App Router (Pages & Layouts)
│   │   ├── admin/           # Admin-only routes
│   │   ├── guru/            # Teacher-only routes
│   │   └── api/             # API Route handlers
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # Shadcn/Radix primitive components
│   │   └── dashboard/       # Feature-specific components
│   ├── server/              # Backend logic (tRPC & Server Actions)
│   │   ├── api/             # tRPC router definitions
│   │   └── db.ts            # Prisma client initialization
│   ├── lib/                 # Shared utilities & configurations
│   ├── store/               # Global state (Zustand)
│   ├── styles/              # Global CSS & Tailwind config
│   ├── trpc/                # tRPC frontend integration
│   └── types/               # Shared TypeScript definitions
├── biome.json               # Biome linting/formatting config
├── start-database.sh        # Local Docker DB helper script
├── check-murid.ts           # Data validation utility
├── next.config.js           # Next.js configuration
├── package.json             # Project dependencies & scripts
└── tsconfig.json            # TypeScript configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20.x or higher
- **pnpm**: v9.x recommended
- **Docker**: (Optional) For running a local database

### 1. Clone & Install
```bash
git clone <repository-url>
cd sistem_english_hive
pnpm install
```

### 2. Environment Configuration
Copy the template and fill in your credentials:
```bash
cp .env.example .env
```
> [!IMPORTANT]
> Ensure `DATABASE_URL` is correctly set to your PostgreSQL instance.

### 3. Database Setup
If you have Docker installed, you can quickly spin up a local PostgreSQL instance:
```bash
# Start local DB via Docker
./start-database.sh

# Push the schema to your database
pnpm db:push

# (Optional) Seed the database with initial data
pnpm prisma db seed
```

### 4. Launch Development
```bash
pnpm dev
```
Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

---

## 🛠️ Development Toolkit

| Command | Action |
| :--- | :--- |
| `pnpm dev` | Starts the development server with Turbo |
| `pnpm build` | Compiles the application for production |
| `pnpm start` | Launches the production server |
| `pnpm check` | Runs Biome lint & format validation |
| `pnpm format` | Automatically fixes lint/format issues |
| `pnpm typecheck`| Validates TypeScript types |
| `pnpm test` | Executes Vitest test suite |
| `pnpm db:studio`| Opens Prisma Studio for data browsing |
| `pnpm db:generate`| Creates a new migration from schema changes |

---

## 📝 License
This project is private and intended for use by **English Hive**. All rights reserved.

