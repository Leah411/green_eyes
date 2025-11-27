# Connecting Frontend and Backend

This guide explains how to connect your Next.js frontend to your Django backend.

---

## 🔗 How They Connect

The frontend and backend are already configured to work together:

- **Frontend** (Next.js) runs on: `http://localhost:3000`
- **Backend** (Django) runs on: `http://localhost:8000`
- **API Base URL**: `http://localhost:8000/api`

The frontend automatically connects to the backend using the API client configured in `frontend/lib/api.ts`.

---

## 📋 Step-by-Step Setup

### Step 1: Start the Backend (Django)

1. **Open PowerShell** in your project root (`green_eyes`)

2. **Activate virtual environment:**
   ```powershell
   venv\Scripts\Activate.ps1
   ```

3. **Start Django server:**
   ```powershell
   python manage.py runserver
   ```

4. **Verify it's running:**
   - You should see: `Starting development server at http://127.0.0.1:8000/`
   - Test in browser: http://localhost:8000/api/health/
   - Should return: `{"status": "healthy", ...}`

5. **Keep this terminal window open** (the server must stay running)

---

### Step 2: Start the Frontend (Next.js)

1. **Open a NEW PowerShell window** (keep the backend running in the first window)

2. **Navigate to frontend directory:**
   ```powershell
   cd C:\Users\lvins\yarok_beenaim\green_eyes\frontend
   ```

3. **Install dependencies** (if you haven't already):
   ```powershell
   npm install
   ```
   ⏳ This may take a few minutes the first time

4. **Start Next.js development server:**
   ```powershell
   npm run dev
   ```

5. **Verify it's running:**
   - You should see: `Ready on http://localhost:3000`
   - Open browser: http://localhost:3000
   - You should see your application

6. **Keep this terminal window open** (the frontend server must stay running)

---

## ✅ Verify Connection

### Test 1: Check Frontend Can Reach Backend

1. Open your browser's **Developer Tools** (F12)
2. Go to the **Network** tab
3. Visit: http://localhost:3000
4. Look for API calls to `http://localhost:8000/api/`
5. If you see successful requests (status 200), they're connected! ✅

### Test 2: Test API from Frontend

1. Open browser console (F12 → Console tab)
2. Visit: http://localhost:3000
3. The frontend should automatically try to connect to the backend
4. Check for any CORS errors in the console
5. If no errors, connection is working! ✅

### Test 3: Manual API Test

1. In browser, go to: http://localhost:3000
2. Try to register a user or request an OTP
3. Check the Network tab to see if requests go to `http://localhost:8000/api/`
4. If requests succeed, everything is connected! ✅

---

## ⚙️ Configuration

### Backend CORS Settings

The backend is already configured to allow requests from the frontend:

**File:** `yirok_project/settings.py`

```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
```

✅ **Already configured** - no changes needed!

### Frontend API URL

The frontend uses an environment variable to know where the backend is:

**File:** `frontend/lib/api.ts`

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

**Default:** `http://localhost:8000` (already correct!)

---

## 🔧 Optional: Customize API URL

If you need to change the backend URL (e.g., for production), create a `.env.local` file in the `frontend` directory:

### Create Frontend Environment File

1. **Navigate to frontend:**
   ```powershell
   cd frontend
   ```

2. **Create `.env.local` file:**
   ```powershell
   New-Item .env.local
   ```

3. **Add your API URL:**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Restart Next.js** (stop with Ctrl+C and run `npm run dev` again)

**Note:** For development, you don't need this file - the default works fine!

---

## 🚀 Running Both Services

You need **TWO terminal windows** running simultaneously:

### Terminal 1: Backend (Django)
```powershell
# In project root
venv\Scripts\Activate.ps1
python manage.py runserver
```

### Terminal 2: Frontend (Next.js)
```powershell
# In frontend directory
cd frontend
npm run dev
```

**Both must be running at the same time!**

---

## 🐛 Troubleshooting

### Problem: "Network Error" or "Failed to fetch"

**Solution:**
1. ✅ Make sure backend is running (`python manage.py runserver`)
2. ✅ Check backend is accessible: http://localhost:8000/api/health/
3. ✅ Make sure frontend is running (`npm run dev`)
4. ✅ Check CORS settings in `yirok_project/settings.py`
5. ✅ Verify `NEXT_PUBLIC_API_URL` is correct (should be `http://localhost:8000`)

### Problem: CORS Error in Browser Console

**Error looks like:**
```
Access to fetch at 'http://localhost:8000/api/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Solution:**
1. Check `CORS_ALLOWED_ORIGINS` in `yirok_project/settings.py`
2. Make sure it includes `http://localhost:3000`
3. Restart Django server after changing settings

### Problem: "Cannot connect to backend"

**Solution:**
1. Check if backend is running: http://localhost:8000/api/health/
2. Check if port 8000 is being used by another program
3. Try changing Django port: `python manage.py runserver 8001`
4. Update frontend `.env.local` to match: `NEXT_PUBLIC_API_URL=http://localhost:8001`

### Problem: Frontend shows "Loading..." forever

**Solution:**
1. Check browser console (F12) for errors
2. Check Network tab to see if API calls are failing
3. Verify backend is running and accessible
4. Check backend terminal for error messages

### Problem: "Module not found" in frontend

**Solution:**
1. Make sure you're in the `frontend` directory
2. Run: `npm install`
3. Restart Next.js: `npm run dev`

---

## 📝 Quick Reference

### Backend URLs
- **API Base:** http://localhost:8000/api/
- **Health Check:** http://localhost:8000/api/health/
- **Admin Panel:** http://localhost:8000/admin/
- **API Root:** http://localhost:8000/api/

### Frontend URLs
- **Main App:** http://localhost:3000
- **Login:** http://localhost:3000
- **Dashboard:** http://localhost:3000/dashboard/user
- **Verify OTP:** http://localhost:3000/verify-otp

### Environment Variables

**Backend (.env in project root):**
```env
DB_NAME=postgres
DB_USER=postgres
DB_PASS=your-password
DB_HOST=db.your-project.supabase.co
DB_PORT=5432
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=*
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**Frontend (.env.local in frontend directory - optional):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## ✅ Connection Checklist

Use this checklist to verify everything is connected:

- [ ] Backend server is running (`python manage.py runserver`)
- [ ] Backend is accessible: http://localhost:8000/api/health/
- [ ] Frontend server is running (`npm run dev` in frontend directory)
- [ ] Frontend is accessible: http://localhost:3000
- [ ] No CORS errors in browser console
- [ ] API calls appear in Network tab
- [ ] Can register/login from frontend
- [ ] Data appears in Supabase dashboard

---

## 🎯 How It Works

1. **User visits** http://localhost:3000 (frontend)
2. **Frontend makes API calls** to http://localhost:8000/api/ (backend)
3. **Backend processes requests** and queries Supabase database
4. **Backend returns JSON** responses to frontend
5. **Frontend displays** the data to the user

**Flow:**
```
Browser → Frontend (Next.js) → Backend (Django) → Supabase (Database)
         ←                    ←                    ←
```

---

## 🎉 Success!

If you can:
- ✅ See the frontend at http://localhost:3000
- ✅ See API calls in Network tab
- ✅ Register/login users
- ✅ See data in Supabase dashboard

Then your frontend and backend are successfully connected! 🚀

---

**Need help?** Check the browser console (F12) and backend terminal for error messages.

