# MotoVault / KawaCoder

A full-stack motorcycle management web app. Dark-themed, motorcycle enthusiast aesthetic.

## Tech Stack

- **Frontend**: React + TypeScript + Vite, Tailwind CSS, shadcn/ui, TanStack Query, wouter (routing)
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: Session-based (express-session + memorystore)
- **File Uploads**: multer (saved to `/uploads/`, served statically)

## Features

- **Auth**: Register / Login / Logout (session-based) — motorcycle rev sound plays on success
- **Garage**: CRUD motorcycle cards with direct image upload (drag & drop or click)
- **Photo Edit**: Camera icon overlay on card hover and on detail hero — opens change photo dialog
- **Brand Theme System**: Settings modal (gear icon in sidebar) with 6 brand themes (Kawasaki, Ducati, BMW, Honda, Yamaha, Harley) — persisted in localStorage
- **Motorcycle Details**: Maintenance & modification history, registration document tab
- **Dashboard**: Expense summary and recent activity
- **Web3**: MetaMask wallet connect for NFT linking per motorcycle
- **Footer**: KawaCoder branding + trademark disclaimer on all authenticated pages
- **Date inputs**: All date fields use type="text" with YYYY-MM-DD placeholder (no right-to-left browser date behavior)

## Key Files

- `shared/schema.ts` — Drizzle schema + Zod types
- `shared/routes.ts` — API route definitions
- `server/routes.ts` — Express route handlers (includes multer upload endpoint)
- `server/storage.ts` — Database CRUD interface
- `client/src/lib/themes.ts` — Brand theme definitions
- `client/src/context/ThemeContext.tsx` — Theme context provider
- `client/src/components/ui/ImageUploadField.tsx` — Reusable image upload component
- `client/src/pages/Garage.tsx` — Garage page with add / photo edit
- `client/src/pages/MotorcycleDetails.tsx` — Detail page with hero photo edit

## Design Notes

- Dark base: near-black `#080808`, cards `#0d0d0d`
- Primary color is dynamic via CSS variables (set by ThemeProvider)
- Font: Inter (body) + Rajdhani (display/headings)
- Uploads stored in `/uploads/` directory, served at `/uploads/:filename`
- Passwords stored plain text (demo only — not for production)

## Run

`npm run dev` — starts Express (port 5000) + Vite dev server
