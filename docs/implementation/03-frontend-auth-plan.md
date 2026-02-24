# 03 - Frontend Auth Integration Plan

Date: 2026-02-23
Topic: Frontend Auth Wiring (Firebase Client SDK → Express API)
Location: `docs/implementation/03-frontend-auth-plan.md`

Now that our Express backend is live, communicating with PostgreSQL, and strictly validating Firebase Bearer tokens, the React frontend must be updated to acquire those tokens and inject them into its requests.

---

## 1. Technical Stack Additions (Frontend)

*   `firebase`: The official Firebase Client SDK.
*   `axios`: For robust HTTP requests and global interceptor configuration.
*   `react-router-dom`: To protect specific routes (e.g., Dashboard, Galaxy Map) from unauthenticated users.

---

## 2. Implementation Architecture

We will implement a clean, context-driven auth architecture so any component in the React app can know who is logged in and make authenticated requests automatically.

### A. The Firebase Configuration (`src/config/firebase.js`)
Initialize the Firebase app using the public config object provided by the Firebase Console. This exposes the `auth` object we use to trigger logins.

### B. The Auth Context (`src/context/AuthContext.jsx`)
A global React Context provider that wraps the application. 
*   Listens to `onAuthStateChanged`.
*   Stores the current `currentUser` state.
*   Exposes `loginWithGoogle()`, `loginWithEmail()`, and `logout()` functions so the login UI can easily trigger them.

### C. The Axios Interceptor (`src/api/client.js`)
We will create a pre-configured Axios instance. Before *any* request fires, an interceptor will ask Firebase for the current user's ID token and transparently append it:
```javascript
// Conceptual interceptor logic
instance.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### D. Protected Routes (`src/components/ProtectedRoute.jsx`)
A higher-order component that checks the `AuthContext`. If `currentUser` is null, it redirects the user back to the Login/Landing page.

### E. The Auth Sync Flow (The Bridge)
When `onAuthStateChanged` fires and detects a new login, the frontend must make one critical call:
`POST /api/v1/auth/sync`
This tells our Express server: *"Hey, Firebase says I'm logged in. Make sure I exist in the PostgreSQL users table."*

---

## 3. Execution Roadmap

To execute this plan locally, follow these steps:

1.  **Firebase Client Setup:**
    *   Grab your public Firebase Config from the Firebase Console (Web App settings).
    *   Add them to `/frontend/.env` (e.g., `VITE_FIREBASE_API_KEY`, etc.).
2.  **Install Dependencies:**
    *   Run `npm install firebase axios react-router-dom` in `/frontend`.
3.  **Create Boilerplate Files:**
    *   Implement `/src/config/firebase.js`.
    *   Implement `/src/context/AuthContext.jsx`.
    *   Implement `/src/api/client.js`.
4.  **Refactor `App.jsx`:**
    *   Wrap the application in `<AuthProvider>`.
    *   Wrap the `<Dashboard>`, `<GalaxyMap>`, etc., in `<ProtectedRoute>`.
5.  **Refactor Login Page:**
    *   Replace the dummy "Continue" button with an actual `loginWithGoogle` trigger.
6.  **Verify Sync:**
    *   Login, check the Network tab, ensure `/api/v1/auth/sync` fires and returns a `200 OK` from the Express backend, confirming the PostgreSQL user creation!
