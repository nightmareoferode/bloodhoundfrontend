# Authentication Guide

This document explains how JWT (JSON Web Token) authentication works in the Bloodhound API.

## Overview

The API uses JWT tokens for user authentication. Tokens are issued on successful signup or login and must be included in subsequent requests to protected endpoints.

---

## Token Issuance

### When are tokens issued?

JWT tokens are issued in two scenarios:

1. **POST /signup** - When a new user creates an account
2. **POST /login** - When an existing user authenticates

### How is the token sent to the client?

The token is sent in **TWO places** for maximum compatibility:

#### 1. **Authorization Response Header**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- Contains the raw token with `Bearer` prefix
- Recommended for React Native and mobile apps
- Easy to extract and store in app storage

#### 2. **HTTP-Only Cookie**
```
Set-Cookie: access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; SameSite=Lax
```
- Cookie name: `access_token`
- Automatically managed by browsers
- `HttpOnly` flag prevents JavaScript access (security feature)
- `SameSite=Lax` provides CSRF protection
- Recommended for web applications

---

## Token Structure

### What's inside the token?

The JWT contains the following claims:

| Claim | Type | Description |
|-------|------|-------------|
| `sub` | string | User ID (stored as string, e.g., `"123"`) |
| `exp` | integer | Expiration timestamp (Unix epoch) |

**Example decoded token:**
```json
{
  "sub": "42",
  "exp": 1748534400
}
```

### Token Validity

- **Lifetime**: 30 days from creation
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Secret Key**: Configured via `JWT_SECRET_KEY` environment variable

### Token Expiration

When a token expires:
- Protected endpoints return `401 Unauthorized`
- User must log in again to get a new token
- There is **no token refresh mechanism** - users must re-authenticate

---

## Using Tokens in React Native

### Step 1: Save the Token After Login/Signup

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

async function signup(userData) {
  const response = await fetch('http://localhost:8000/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (response.ok) {
    // Extract token from Authorization header
    const token = response.headers.get('Authorization').replace('Bearer ', '');
    
    // Save to AsyncStorage
    await AsyncStorage.setItem('access_token', token);
    
    const data = await response.json();
    return { token, ...data };
  } else {
    throw new Error('Signup failed');
  }
}

async function login(credentials) {
  const response = await fetch('http://localhost:8000/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (response.ok) {
    // Extract token from Authorization header
    const token = response.headers.get('Authorization').replace('Bearer ', '');
    
    // Save to AsyncStorage
    await AsyncStorage.setItem('access_token', token);
    
    const data = await response.json();
    return { token, ...data };
  } else {
    throw new Error('Login failed');
  }
}
```

### Step 2: Include Token in Protected Requests

```javascript
async function fetchUserProfile() {
  // Retrieve token from storage
  const token = await AsyncStorage.getItem('access_token');
  
  if (!token) {
    throw new Error('No token found - user not logged in');
  }

  const response = await fetch('http://localhost:8000/users/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.ok) {
    return await response.json();
  } else if (response.status === 401) {
    // Token expired or invalid - redirect to login
    await AsyncStorage.removeItem('access_token');
    throw new Error('Session expired - please log in again');
  } else {
    throw new Error('Failed to fetch profile');
  }
}
```

### Step 3: Create a Reusable Fetch Wrapper

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiClient {
  constructor(baseURL = 'http://localhost:8000') {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const token = await AsyncStorage.getItem('access_token');
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Add Authorization header if token exists
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, config);

    // Handle token expiration
    if (response.status === 401) {
      await AsyncStorage.removeItem('access_token');
      throw new Error('Session expired - please log in again');
    }

    return response;
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Usage
const api = new ApiClient();

// Login and save token
const loginResponse = await api.post('/login', { email: 'user@example.com', password: 'password' });
const token = loginResponse.headers.get('Authorization').replace('Bearer ', '');
await AsyncStorage.setItem('access_token', token);

// Make authenticated requests
const userResponse = await api.get('/users/me');
const user = await userResponse.json();
```

### Step 4: Handle Logout

```javascript
async function logout() {
  // Remove token from storage
  await AsyncStorage.removeItem('access_token');
  
  // Navigate to login screen
  // navigation.navigate('Login');
}
```

---

## Protected Endpoints

The following endpoints **require authentication**:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/me` | Get current user profile |
| PATCH | `/users/me` | Update user profile |
| DELETE | `/users/me` | Delete user account |
| GET | `/medications` | List user's medications |
| PATCH | `/medications` | Replace all medications |
| PATCH | `/medications/{id}` | Update specific medication |
| DELETE | `/medications` | Delete all medications |
| DELETE | `/medications/{id}` | Delete specific medication |

## Public Endpoints

The following endpoints **do NOT require authentication**:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/signup` | Create new user account |
| POST | `/login` | Authenticate existing user |
| POST | `/quickreference` | Analyze drug interactions |

---

## How to Provide the Token

### Option 1: Authorization Header (Recommended for React Native)

```http
GET /users/me HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**JavaScript/React Native:**
```javascript
const response = await fetch('http://localhost:8000/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

### Option 2: Cookie (Automatic for Web Browsers)

If you're using the API from a web browser, cookies are automatically sent with every request after login/signup. No additional code needed!

```javascript
// Cookie is automatically included
const response = await fetch('http://localhost:8000/users/me', {
  credentials: 'include', // Important: include cookies in cross-origin requests
});
```

---

## Token Validation Flow

The API validates tokens as follows:

1. **Extract token** from either:
   - `Authorization` header (format: `Bearer <token>`)
   - `access_token` cookie

2. **Decode and verify** using HS256 algorithm with secret key

3. **Check expiration** - reject if `exp` claim is in the past

4. **Extract user ID** from `sub` claim

5. **Lookup user** in database - reject if user doesn't exist

6. **Return user object** to route handler

### Authentication Errors

| Error | Status Code | Cause |
|-------|-------------|-------|
| Could not validate credentials | 401 | Missing token, invalid token, expired token, or user not found |

**Example error response:**
```json
{
  "detail": "Could not validate credentials"
}
```

---

## Security Best Practices

### For React Native Apps:

1. ✅ **Store tokens in AsyncStorage** (or SecureStore for extra security)
2. ✅ **Use HTTPS in production** to prevent token interception
3. ✅ **Clear token on logout** to prevent unauthorized access
4. ✅ **Handle 401 errors gracefully** by redirecting to login
5. ✅ **Don't log tokens** in production builds
6. ❌ **Never share tokens** between users or devices

### For Web Apps:

1. ✅ **Use cookies with `HttpOnly` flag** (already configured)
2. ✅ **Enable `SameSite` protection** (already configured as `Lax`)
3. ✅ **Use HTTPS in production** to protect cookies in transit
4. ✅ **Handle 401 errors** by redirecting to login page

---

## Common Issues and Solutions

### Issue: "Could not validate credentials" on every request

**Cause**: Token not being sent correctly

**Solutions**:
- Verify token is stored in AsyncStorage: `AsyncStorage.getItem('access_token')`
- Check Authorization header format: `Bearer <token>` (note the space)
- Ensure token hasn't expired (30 days from issuance)

### Issue: Token expires too quickly

**Cause**: Token has 30-day expiration by default

**Solutions**:
- Implement a "remember me" feature that prompts re-login after 30 days
- Consider implementing refresh tokens (requires code changes)

### Issue: CORS errors in web browser

**Cause**: Cross-origin requests without proper configuration

**Solutions**:
- Ensure API has CORS headers configured
- Use `credentials: 'include'` in fetch requests if using cookies
- For React Native, CORS is not an issue

---

## Example: Complete React Native Auth Flow

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Signup
async function signup(username, email, password, medications) {
  const response = await fetch('http://localhost:8000/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password, medications }),
  });

  if (response.ok) {
    const token = response.headers.get('Authorization').replace('Bearer ', '');
    await AsyncStorage.setItem('access_token', token);
    return await response.json();
  }
  throw new Error('Signup failed');
}

// 2. Login
async function login(email, password) {
  const response = await fetch('http://localhost:8000/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (response.ok) {
    const token = response.headers.get('Authorization').replace('Bearer ', '');
    await AsyncStorage.setItem('access_token', token);
    return await response.json();
  }
  throw new Error('Login failed');
}

// 3. Get user profile (authenticated)
async function getUserProfile() {
  const token = await AsyncStorage.getItem('access_token');
  
  const response = await fetch('http://localhost:8000/users/me', {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (response.status === 401) {
    await AsyncStorage.removeItem('access_token');
    throw new Error('Session expired');
  }

  return await response.json();
}

// 4. Update profile (authenticated)
async function updateProfile(updates) {
  const token = await AsyncStorage.getItem('access_token');
  
  const response = await fetch('http://localhost:8000/users/me', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (response.status === 401) {
    await AsyncStorage.removeItem('access_token');
    throw new Error('Session expired');
  }

  return await response.json();
}

// 5. Logout
async function logout() {
  await AsyncStorage.removeItem('access_token');
}

// 6. Check if user is logged in
async function isLoggedIn() {
  const token = await AsyncStorage.getItem('access_token');
  return token !== null;
}
```

---

## Testing Authentication

### Using cURL

```bash
# 1. Signup and capture token
curl -i -X POST http://localhost:8000/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "medications": []
  }'

# Extract token from Authorization header in response
# Example: Authorization: Bearer eyJhbGc...

# 2. Use token in authenticated request
curl -X GET http://localhost:8000/users/me \
  -H "Authorization: Bearer eyJhbGc..."

# 3. Or use cookie (save cookies on login)
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Use cookie in subsequent requests
curl -X GET http://localhost:8000/users/me \
  -b cookies.txt
```

### Using Postman

1. **Login/Signup**:
   - Send POST request to `/login` or `/signup`
   - Copy token from `Authorization` header (remove `Bearer ` prefix)

2. **Set up Authentication**:
   - Go to "Authorization" tab
   - Type: "Bearer Token"
   - Token: Paste your token

3. **Make Authenticated Requests**:
   - Token is automatically included in all requests

---

## Summary

- **Token Location**: Authorization header (`Bearer <token>`) OR cookie (`access_token`)
- **Token Lifetime**: 30 days
- **Token Contents**: User ID (`sub`) and expiration (`exp`)
- **React Native**: Save token in AsyncStorage, include in Authorization header
- **Protected Routes**: All `/users/*` and `/medications/*` endpoints
- **Public Routes**: `/signup`, `/login`, `/quickreference`
- **Token Validation**: Automatic on protected endpoints via `get_current_user` dependency
