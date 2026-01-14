# Environment Variables to Set in Render Dashboard

## Backend Service Environment Variables

Go to: **Render Dashboard** → **Backend Service** → **Environment** tab

### Required Variables

#### 1. Database (Supabase)

```
DB_NAME=postgres
DB_USER=postgres
DB_PASS=your-supabase-password-here
DB_HOST=db.your-project-ref.supabase.co
DB_PORT=5432
```

**How to get these values:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **Database**
4. Copy the connection string
5. Extract the values (see example below)

**Example connection string:**
```
postgresql://postgres:MyPassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
```

**Extracted values:**
- `DB_NAME` = `postgres` (after the last `/`)
- `DB_USER` = `postgres` (before the first `:`)
- `DB_PASS` = `MyPassword123` (between `:` and `@`)
- `DB_HOST` = `db.abcdefghijklmnop.supabase.co` (between `@` and `:5432`)
- `DB_PORT` = `5432` (between `:` and `/`)

#### 2. Django Settings

```
SECRET_KEY=6xg#e=2p&yc5evzwp1%=cp-yh3r9s@@$7&w0e7(ti7j-m8l7ef
DEBUG=False
ALLOWED_HOSTS=green-eyes-uaw4.onrender.com
```

**Note:** 
- `SECRET_KEY` - Use the secure key I generated earlier (or generate a new one)
- `DEBUG` - Must be `False` in production
- `ALLOWED_HOSTS` - Your Render service URL (without `https://`)

#### 3. Email Configuration

**Option A: Console Backend (for testing)**
```
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

**Option B: Gmail SMTP (for production)**
```
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-char-gmail-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

**Important for Gmail:**
- `EMAIL_HOST_USER` and `DEFAULT_FROM_EMAIL` must be **exactly the same**
- `EMAIL_HOST_PASSWORD` must be a **Gmail App Password** (16 characters), not your regular password
- Get App Password from: https://myaccount.google.com/apppasswords

#### 4. CORS Settings

```
CORS_ALLOWED_ORIGINS=https://green-eyes-frontend.onrender.com
```

**Note:** 
- This should be your frontend URL
- No trailing slash (`/`)
- Must start with `https://`

#### 5. Python Version

```
PYTHON_VERSION=3.11
```

#### 6. Optional Settings

```
OTP_RATE_LIMIT=5
OTP_EXPIRY_MINUTES=10
```

---

## Frontend Service Environment Variables

Go to: **Render Dashboard** → **Frontend Service** → **Environment** tab

### Required Variables

```
NODE_VERSION=18
NEXT_PUBLIC_API_URL=https://green-eyes-uaw4.onrender.com
```

**Note:**
- `NEXT_PUBLIC_API_URL` - Your backend URL (without `/api` at the end)
- Must start with `https://`
- No trailing slash

---

## Complete Checklist

### Backend Service Environment Variables:

- [ ] `DB_NAME` = `postgres`
- [ ] `DB_USER` = `postgres`
- [ ] `DB_PASS` = Your Supabase password
- [ ] `DB_HOST` = Your Supabase host (e.g., `db.xxxxx.supabase.co`)
- [ ] `DB_PORT` = `5432`
- [ ] `SECRET_KEY` = Secure random key
- [ ] `DEBUG` = `False`
- [ ] `ALLOWED_HOSTS` = Your Render backend URL
- [ ] `EMAIL_BACKEND` = Console or SMTP backend
- [ ] `EMAIL_HOST` = `smtp.gmail.com` (if using Gmail)
- [ ] `EMAIL_PORT` = `587`
- [ ] `EMAIL_USE_TLS` = `True`
- [ ] `EMAIL_HOST_USER` = Your email (if using SMTP)
- [ ] `EMAIL_HOST_PASSWORD` = App password (if using SMTP)
- [ ] `DEFAULT_FROM_EMAIL` = Your email (if using SMTP)
- [ ] `CORS_ALLOWED_ORIGINS` = Your frontend URL
- [ ] `PYTHON_VERSION` = `3.11`

### Frontend Service Environment Variables:

- [ ] `NODE_VERSION` = `18`
- [ ] `NEXT_PUBLIC_API_URL` = Your backend URL

---

## How to Add Variables in Render

1. Go to your service in Render Dashboard
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"** button
4. Enter:
   - **Key**: The variable name (e.g., `DB_NAME`)
   - **Value**: The variable value (e.g., `postgres`)
5. Click **"Save Changes"**
6. Render will automatically redeploy

---

## Important Notes

1. **No spaces** around the `=` sign
2. **No quotes** around values (unless the value itself contains spaces)
3. **Case sensitive** - variable names must match exactly
4. **Save after each change** - Render will redeploy automatically
5. **Environment variables override `render.yaml`** - So you can set Supabase even though `render.yaml` says Render PostgreSQL

---

## Quick Reference: Your Current URLs

- **Backend**: `https://green-eyes-uaw4.onrender.com`
- **Frontend**: `https://green-eyes-frontend.onrender.com`

Use these in your environment variables!


