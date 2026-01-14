# Deploy Next.js Frontend on Render

## Quick Setup Guide

### Step 1: Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository (`green_eyes`)
4. Select the repository    

### Step 2: Configure Service Settings

**Basic Settings:**
- **Name**: `yirok-frontend` (or `green-eyes-frontend`)
- **Region**: Same as backend (Virginia US East)
- **Branch**: `main`
- **Root Directory**: `frontend` ⚠️ **IMPORTANT!**

**Build & Deploy:**
- **Environment**: **Node**
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Auto-Deploy**: **Yes** (On Commit)

**Advanced Settings (optional):**
- **Health Check Path**: Leave empty (or use `/` if you have a health endpoint)
- **Pre-Deploy Command**: Leave empty

### Step 3: Set Environment Variables

Go to **Environment** tab and add:

**Required:**
- `NODE_VERSION` = `18`
- `NEXT_PUBLIC_API_URL` = `https://green-eyes-uaw4.onrender.com` (your backend URL)

**Note:** Replace `green-eyes-uaw4.onrender.com` with your actual backend URL!

### Step 4: Create Service

Click **"Create Web Service"**

### Step 5: Wait for Deployment

- First build takes 3-5 minutes
- Watch the logs for progress
- You'll get a URL like: `https://yirok-frontend.onrender.com`

### Step 6: Update Backend CORS

After frontend is deployed:

1. Go to your **Django backend service** in Render
2. **Environment** tab
3. Find `CORS_ALLOWED_ORIGINS`
4. Update it to include your frontend URL:
   ```
   https://yirok-frontend.onrender.com
   ```
   Or if you have multiple:
   ```
   https://yirok-frontend.onrender.com,https://your-custom-domain.com
   ```
5. **Save** (this will trigger a redeploy)

### Step 7: Test

Visit your frontend URL:
- `https://yirok-frontend.onrender.com`

It should connect to your backend API!

---

## Troubleshooting

### Build Fails

**Error: "Cannot find module"**
- Check Root Directory is set to `frontend`
- Verify `package.json` exists in `frontend/` folder

**Error: "npm install failed"**
- Check Node version (should be 18)
- Check `package.json` is valid

### Frontend Can't Connect to Backend

**CORS Error:**
- Make sure `CORS_ALLOWED_ORIGINS` in backend includes frontend URL
- Check URLs match exactly (no trailing slashes)
- Restart backend after changing CORS

**API Connection Error:**
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check backend is running and accessible
- Test backend health: `https://your-backend.onrender.com/api/health/`

### Page Shows Blank/Error

- Check browser console for errors
- Verify `NEXT_PUBLIC_API_URL` environment variable is set
- Make sure frontend build completed successfully

---

## Alternative: Use Blueprint (If Not Already Done)

If you want to use the Blueprint method to deploy everything together:

1. **Delete** any existing services (or start fresh)
2. Go to **"New +"** → **"Blueprint"**
3. Connect repository
4. Render will read `render.yaml` and create:
   - `yirok-postgres` (database)
   - `yirok-django` (backend) ✅ Already deployed
   - `yirok-frontend` (frontend) ⚠️ Should create this

5. After Blueprint creates services, add environment variables to each

---

## Current Status

✅ **Backend**: Deployed at `https://green-eyes-uaw4.onrender.com`
⏳ **Frontend**: Needs to be deployed
⏳ **Database**: Should be created (check if `yirok-postgres` exists)

---

## Quick Checklist

- [ ] Frontend service created on Render
- [ ] Root Directory set to `frontend`
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm start`
- [ ] Environment Variable: `NEXT_PUBLIC_API_URL` = your backend URL
- [ ] Backend CORS updated with frontend URL
- [ ] Frontend accessible and working


