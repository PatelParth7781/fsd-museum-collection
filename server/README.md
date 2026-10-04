# Museum Collection Management System

A MERN stack application to manage museum artifacts, artists, categories, exhibitions, reviews and more.

## Tech Stack
- **MongoDB** (Mongoose)
- **Express.js** and **Node.js** (REST API in `server/`)
- **React** + TypeScript + Vite + Tailwind CSS (frontend in `src/`)

## Run Locally

1. Backend
```bash
   cd server
   npm install
   npm run seed
   npm run dev
```
   Runs on http://localhost:5000

2. Frontend (from the root folder)
```bash
   npm install
   npm run dev
```
   Runs on http://localhost:5173

## Environment Variables
- `server/.env`: `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`
- root `.env`: `VITE_API_URL`