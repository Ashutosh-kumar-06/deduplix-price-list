# DeDupliX

DeDupliX is a full-stack web app for uploading price lists, detecting exact and fuzzy duplicates, resolving conflicts, and exporting cleaned data.

## Features

- Upload price lists from CSV or JSON.
- Normalize PL numbers and detect duplicates with exact + fuzzy matching.
- Review duplicate groups with score metadata (`matchScore`, `reason`, `type`).
- Resolve duplicates with merge/delete actions and resolution history tracking.
- Manage records (create, edit, soft-delete).
- Export cleaned records and duplicate reports as CSV.
- Dashboard stats for data quality and upload trend.

## Tech Stack

- Backend: Node.js, Express, MongoDB, Mongoose, JWT
- Frontend: Vanilla JavaScript modules + static HTML/CSS
- Auth: Email/password auth (Google OAuth routes are currently stubbed)

## Prerequisites

- Node.js 18+
- MongoDB connection string

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create/update `.env` in the project root:

```env
PORT=3000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-strong-secret

# Optional Firebase public config exposed through /app-config.js
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
FIREBASE_MEASUREMENT_ID=
```

3. Start the app:

```bash
npm run dev
```

Or production mode:

```bash
npm start
```

4. Open:

```text
http://localhost:3000
```

## Default Seed Data

On first successful DB connection, the app seeds:

- Default user: `user@example.com` / `user12345`
- Sample price list records (if collection is empty)

## Upload Format Notes

- CSV headers are normalized to lowercase.
- UTF-8 BOM in the first header is supported.
- Delimiter auto-detection supports comma, semicolon, and tab.
- Rows without a valid PL number are skipped.

Recognized PL number header variants include:

- `pl number`, `plnumber`, `pl no`, `pl`, `price list number`

Common mapped fields:

- Description: `description`, `desc`, `product name`, `item name`, `title`
- Category: `category`, `cat`
- Vendor: `vendor`, `supplier`
- Price: `price`, `rate`, `amount`, `cost`

## API Overview

Base URL: `/api`

Auth:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/profile` (requires bearer token)

Price list:

- `POST /prices/upload`
- `GET /prices`
- `GET /prices/stats`
- `GET /prices/duplicates`
- `GET /prices/download-cleaned`
- `GET /prices/download-duplicates`
- `POST /prices`
- `PUT /prices/:id`
- `DELETE /prices/:id` (soft delete via `status=removed`)
- `POST /prices/resolve`
- `DELETE /prices/remove-duplicate/:id`
- `POST /prices/bulk-resolve`

Health check:

- `GET /api/health`

## Project Structure

```text
.
├── index.html
├── server.js
├── package.json
├── test.json
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   └── passport.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── priceController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── PriceList.js
│   │   ├── ResolutionHistory.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── priceRoutes.js
│   └── utils/
│       ├── csvParser.js
│       └── duplicateChecker.js
├── css/
│   └── styles.css
└── js/
    └── frontend/
        ├── firebaseConfig.js
        ├── main.js
        ├── navigation.js
        ├── api/
        │   └── client.js
        ├── auth/
        │   └── authState.js
        ├── pages/
        │   ├── dashboardPage.js
        │   ├── duplicatesPage.js
        │   ├── landingPage.js
        │   ├── loginPage.js
        │   ├── recordsPage.js
        │   ├── signupPage.js
        │   └── uploadPage.js
        └── ui/
            ├── modal.js
            ├── sidebar.js
            ├── toast.js
            ├── topbar.js
            └── tour.js
```

## Notes

- Google OAuth endpoints currently return `501 Not Implemented` unless Passport strategy wiring is completed.
- If `MONGODB_URI` is missing, the server exits with an explicit configuration error.
