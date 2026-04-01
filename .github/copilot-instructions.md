# Copilot Instructions

## Project Overview

Bloodhound is a React Native/Expo drug interaction checker app. Users manage their medication profiles and check for potential drug interactions via a FastAPI backend that uses FDA/RxNorm data and AI-powered clinical reasoning.

## Commands

```bash
# Development
npm start           # Start Expo dev server
npm run ios         # Run on iOS
npm run android     # Run on Android
npm run web         # Run in web browser
```

## Architecture

### Frontend (This Repo)
- **Expo Router** (`app/`) — File-based routing. Each `.tsx` file in `app/` is a route
- **Components** (`components/`) — Reusable UI components
- **State Management** (`store/`) — Simple async storage modules (no Redux/Zustand)
- **Styling** — Inline `StyleSheet.create()` per component, no shared style system

### Backend API
Base URL: `http://localhost:8000`

**Public endpoints:**
- `POST /signup` — Create account with optional medications
- `POST /login` — Authenticate (email or phone)
- `POST /quickreference` — Analyze drug interactions (no auth required)

**Protected endpoints (require `Authorization: Bearer <token>`):**
- `GET/PATCH/DELETE /users/me` — User profile
- `GET/PATCH/DELETE /medications` — User's medications

### Authentication
- JWT tokens returned in `Authorization` response header (raw token, no "Bearer" prefix)
- Store token via `expo-secure-store` (native) or `localStorage` (web)
- Include token in requests as `Authorization: Bearer <token>` header
- Use `authenticatedFetch()` from `authStore.ts` for protected endpoints
- Tokens expire after 30 days with no refresh — user must re-login
- On 401 response, clear token and redirect to login

## Key Conventions

### Form Validation
Use `react-hook-form` with `zod` schemas and `@hookform/resolvers/zod`. Define schemas at the top of form components.

### Storage
Use the `store/` modules which abstract `expo-secure-store` (native) vs `localStorage` (web):
- `authStore.ts` — JWT token, login/signup API calls, `authenticatedFetch()` helper
- `medicationStore.ts` — User profile and medications (local cache)
- `searchStore.ts` — Recent search history

### Type Aliases
Path alias `@/*` maps to the project root. Import like `import { ... } from '@/store/medicationStore'`.

### Medication Data Model
Medications require these fields for API submission:
- `name`, `potency`, `product_type` (Tablet/Capsule/Liquid/Injection/Topical)
- `method_of_intake` (Oral/Intravenous/Sublingual/Inhalation)
- `course_duration_value`, `course_duration_unit` (Days/Weeks/Months)
- `frequency`, `first_dose_time` (HH:MM:SS format)

The backend enriches medications with `rxcui` and `usa_name` from RxNorm lookup.

### UI Patterns
- Primary color: `#2B6CB0` (blue)
- Background: `#F0F4F8` (light gray)
- Cards: White background with subtle shadows
- Buttons: Rounded corners, centered text
