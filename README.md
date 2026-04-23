# DeDupliX

DeDupliX is a full-stack web app for uploading price lists, finding exact and fuzzy duplicates, resolving conflicts, and exporting cleaned records.

## 1) Core Capabilities

- Upload price lists from CSV or JSON.
- Normalize PL numbers before comparison.
- Detect duplicate groups with metadata (matchScore, reason, type).
- Review duplicate groups and resolve by keep, merge, or delete workflow.
- Manage records with create, edit, and soft delete operations.
- Export cleaned data and duplicate reports in CSV format.
- Track quality with dashboard statistics.

## 2) Authentication Model (Important)

DeDupliX currently supports two auth paths:

- Email and password auth through backend JWT endpoints.
- Google sign-in through Firebase popup on the frontend.

Important architecture note:

- Frontend Google login is working via Firebase SDK popup flow.
- Backend routes /api/auth/google and /api/auth/google/callback are currently disabled and return 501 by design.
- This means Google login does not rely on backend Passport routes in the current implementation.

## 3) Tech Stack

- Frontend: Vanilla JavaScript modules, HTML, CSS
- Backend: Node.js, Express
- Database: MongoDB with Mongoose
- Auth: JWT (email/password) + Firebase Google popup auth (frontend)

## 4) Prerequisites

- Node.js 18 or later
- npm
- MongoDB connection string (MongoDB Atlas or local)
- Firebase project (for Google popup sign-in)

## 5) Environment Variables

Create a .env file in the project root:

PORT=3000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-strong-secret

# Firebase public config exposed via /app-config.js

FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
FIREBASE_MEASUREMENT_ID=

Notes:

- FIREBASE_API_KEY is required for Google popup login.
- If FIREBASE_AUTH_DOMAIN is empty, defaults are used from server-side runtime config.
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL are not required for the current live Google login path because backend Passport Google routes are not active.

## 6) Setup and Run

1. Install dependencies

npm install

2. Start in development mode

npm run dev

3. Start in production mode

npm start

4. Open in browser

http://localhost:3000

## 7) Verify Google Sign-In Is Working

Use this checklist:

1. In Firebase Console, enable Google provider in Authentication.
2. Add localhost to Authorized domains in Firebase Authentication settings.
3. Set FIREBASE_API_KEY (and ideally all Firebase vars) in .env.
4. Restart the server.
5. Open Login or Signup page and click Continue with Google.
6. On success, user is stored in localStorage and redirected to dashboard.

Behavior details:

- Google sign-in is executed by signInWithPopup in frontend firebaseConfig module.
- Successful login stores token and user payload in localStorage keys used by authState.

## 8) API Summary

Base URL: /api

Auth:

- POST /auth/register
- POST /auth/login
- GET /auth/profile (Bearer token)
- GET /auth/google (currently returns 501)
- GET /auth/google/callback (currently returns 501)

Price list:

- POST /prices/upload
- GET /prices
- GET /prices/stats
- GET /prices/duplicates
- GET /prices/download-cleaned
- GET /prices/download-duplicates
- POST /prices
- PUT /prices/:id
- DELETE /prices/:id (soft delete)
- POST /prices/resolve
- DELETE /prices/remove-duplicate/:id
- POST /prices/bulk-resolve

Health:

- GET /api/health

## 9) Default Seed Data

On first successful DB connection:

- Creates default user if missing: user@example.com / user12345
- Seeds sample price list records if collection is empty

## 10) Upload Parsing Rules

- CSV headers are normalized to lowercase.
- UTF-8 BOM in first header is handled.
- Delimiter auto-detection supports comma, semicolon, and tab.
- Rows without a valid PL number are skipped.

Recognized PL number header variants:

- pl number
- plnumber
- pl no
- pl
- price list number

Common mapped fields:

- Description: description, desc, product name, item name, title
- Category: category, cat
- Vendor: vendor, supplier
- Price: price, rate, amount, cost

## 11) Project Structure

deduplix-price-list/
index.html
server.js
package.json
backend/
config/
db.js
passport.js
controllers/
authController.js
priceController.js
middleware/
authMiddleware.js
models/
PriceList.js
ResolutionHistory.js
User.js
routes/
authRoutes.js
priceRoutes.js
utils/
csvParser.js
duplicateChecker.js
css/
styles.css
js/frontend/
firebaseConfig.js
main.js
navigation.js
api/client.js
auth/authState.js
pages/
dashboardPage.js
duplicatesPage.js
landingPage.js
loginPage.js
recordsPage.js
signupPage.js
uploadPage.js
ui/
modal.js
sidebar.js
toast.js
topbar.js
tour.js

## 12) Known Limitations

- Backend Passport Google endpoints are stubbed and not part of active login flow.
- Google session persistence currently depends on frontend localStorage state.

## 13) Troubleshooting

1. Google popup does not open

- Check browser popup blocking settings.
- Ensure FIREBASE_API_KEY is present.

2. Google sign-in fails with domain/auth errors

- Verify Authorized domains in Firebase Authentication include localhost.
- Confirm FIREBASE_AUTH_DOMAIN matches your Firebase project.

3. Server fails at startup

- Check that MONGODB_URI is set and valid.

4. API calls fail with 401

- Ensure token exists in localStorage and is sent in Authorization header.
