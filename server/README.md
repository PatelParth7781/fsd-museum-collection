# Museum Collection Management System — Backend API

Express.js and MongoDB backend for the Museum Collection Management System (MCMS).

## 🚀 Overview

This backend provides a full MERN-stack architecture using **Node.js, Express, and MongoDB (via Mongoose)**.

### Tech Stack
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database:** MongoDB (Local or MongoDB Atlas)
- **ODM:** Mongoose
- **Authentication:** JWT (JSON Web Tokens) + bcryptjs

---

## 🛠 Setup & Installation

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Environment Configuration
The `.env` file is located at `server/.env`. A template is provided in `server/.env.example`.

```env
PORT=5000
NODE_ENV=development

# MongoDB Connection String (Local MongoDB or Atlas)
MONGODB_URI=mongodb://127.0.0.1:27017/museum_collection

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Frontend Client Origin for CORS
CLIENT_URL=http://localhost:5173
```

### 3. Seed Database (Optional)
Populate initial categories, artists, historical periods, display locations, and a default administrator account (`admin@museum.org` / `adminPassword123!`):

```bash
npm run seed
```

### 4. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Health check endpoint: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 📁 Directory Structure

```text
server/
├── .env                # Environment variables (ignored by git)
├── .env.example        # Example environment template
├── package.json        # Backend dependencies & scripts
└── src/
    ├── config/
    │   └── db.js       # MongoDB Mongoose connection handler
    ├── middleware/
    │   └── auth.js     # JWT verification & role authorization (admin/curator/visitor)
    ├── models/         # Mongoose models mirroring the museum collection schema
    │   ├── Artifact.js
    │   ├── ArtifactImage.js
    │   ├── Artist.js
    │   ├── AuditLog.js
    │   ├── CartItem.js
    │   ├── Category.js
    │   ├── ConservationRecord.js
    │   ├── Exhibition.js
    │   ├── HistoricalPeriod.js
    │   ├── Location.js
    │   ├── ProvenanceRecord.js
    │   ├── Review.js
    │   └── User.js
    ├── routes/         # REST API Route handlers
    │   ├── artifacts.js
    │   ├── artists.js
    │   ├── audit.js
    │   ├── auth.js
    │   ├── cart.js
    │   ├── categories.js
    │   ├── curator.js
    │   ├── exhibitions.js
    │   ├── locations.js
    │   ├── periods.js
    │   └── reviews.js
    ├── scripts/
    │   └── seed.js     # Database seeder script
    └── index.js        # Main Express server entry point
```

---

## 📡 API Endpoints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/health` | Server and database status check | Public |
| `POST` | `/api/auth/register` | Register new user | Public |
| `POST` | `/api/auth/login` | Authenticate user & get JWT | Public |
| `GET` | `/api/auth/me` | Current user profile | Authenticated |
| `GET` | `/api/auth/users` | List all user accounts | Admin |
| `GET` | `/api/artifacts` | Paginated search & filter artifacts | Public |
| `GET` | `/api/artifacts/:id` | Full artifact details with relations | Public |
| `POST` | `/api/artifacts` | Create artifact record | Staff (Admin/Curator) |
| `PUT` | `/api/artifacts/:id` | Update artifact record | Staff (Admin/Curator) |
| `DELETE` | `/api/artifacts/:id` | Delete artifact | Admin |
| `GET` | `/api/categories` | List artifact categories | Public |
| `GET` | `/api/artists` | List artists / creators | Public |
| `GET` | `/api/periods` | List historical periods | Public |
| `GET` | `/api/locations` | List gallery locations | Public |
| `GET` | `/api/exhibitions` | List museum exhibitions | Public |
| `GET` | `/api/reviews/artifact/:id` | Get reviews and ratings for artifact | Public |
| `POST` | `/api/reviews` | Submit user review | Authenticated |
| `GET` | `/api/cart` | Get user's saved/cart items | Authenticated |
| `POST` | `/api/cart` | Add artifact to cart | Authenticated |
| `DELETE` | `/api/cart/:id` | Remove artifact from cart | Authenticated |
| `GET` | `/api/audit` | Audit log history | Admin |
