# DeDupliX

## Website

DeDupliX is a web application for managing price list records and removing duplicate entries. It provides a focused interface for upload, review, and cleanup so your price list data stays consistent and traceable.

## Use of Website

1. Sign up or log in to access the application.
2. Open Dashboard to view current dataset health and duplicate status.
3. Use Upload to add new price list records.
4. Use PL Records to view, edit, and manage records.
5. Use Duplicate Review to inspect duplicate groups and resolve conflicts.

## File Structure

```text
.
├── index.html
├── server.js
├── package.json
├── package-lock.json
├── .env.example
├── test.json
├── backend/
│   ├── config/
│   │   └── db.js
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
        ├── main.js
        ├── navigation.js
        ├── api/
        │   └── client.js
        ├── auth/
        │   └── authState.js
        ├── pages/
        │   ├── dashboardPage.js
        │   ├── duplicatesPage.js
        │   ├── loginPage.js
        │   ├── recordsPage.js
        │   ├── signupPage.js
        │   └── uploadPage.js
        └── ui/
            ├── modal.js
            ├── sidebar.js
            ├── toast.js
            └── topbar.js
```
