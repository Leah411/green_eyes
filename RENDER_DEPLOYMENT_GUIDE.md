# 🚀 Render Deployment Guide - Step by Step

This guide walks you through deploying your Green Eyes app to Render.com.

## 📋 Quick Overview

Your app has:
- **Backend**: Django (Python) - needs to be deployed
- **Frontend**: Next.js - can deploy separately or together
- **Database**: PostgreSQL - Render will create this automatically

## 🎯 Option 1: Use Render Blueprint (Recommended - Easiest)

If you have a `render.yaml` file (which you do!), use this method:

### Steps:

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Sign in or create account

2. **Create New Blueprint**
   - Click **"New +"** → **"Blueprint"**
   - Connect your GitHub repository
   - Select your repository: `green_eyes`
   - Render will detect `render.yaml` automatically

3. **Review Services**
   - Render will show you 3 services to create:
     - `yirok-postgres` (PostgreSQL database)
     - `yirok-django` (Django backend)
     - `yirok-frontend` (Next.js frontend)
   - Click **"Apply"** to create all services

4. **Set Environment Variables**
   After services are created, you need to add environment variables:

   **For `yirok-django` service:**
   - Go to the service → **Environment** tab
   - Add these variables (click "Add Environment Variable"):
   
   ```
   SECRET_KEY=<generate-a-secure-random-key>
   DEBUG=False
   ALLOWED_HOSTS=green-eyes.onrender.com,your-custom-domain.com
   EMAIL_HOST=smtp.gmail.com
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-gmail-app-password
   DEFAULT_FROM_EMAIL=your-email@gmail.com
   CORS_ALLOWED_ORIGINS=https://yirok-frontend.onrender.com
   ```
   
   **For `yirok-frontend` service:**
   ```
   NEXT_PUBLIC_API_URL=https://yirok-django.onrender.com
   ```

5. **Wait for Deployment**
   - Render will automatically build and deploy
   - First deployment takes 5-10 minutes
   - Watch the logs for progress

6. **Get Your URLs**
   - Backend: `https://yirok-django.onrender.com`
   - Frontend: `https://yirok-frontend.onrender.com`
   - Health check: `https://yirok-django.onrender.com/api/health/`

---

## 🛠️ Option 2: Manual Setup (If Not Using Blueprint)

If you prefer to set up services manually:

### Step 1: Create PostgreSQL Database

1. **New +** → **PostgreSQL**
2. **Settings:**
   - Name: `yirok-postgres`
   - Database: `yirok_db`
   - User: `yirok_user`
   - Region: Virginia (US East)
   - Plan: Free (or paid if needed)
3. Click **"Create Database"**
4. **Note the connection details** (you'll need them)

### Step 2: Create Django Backend Service

1. **New +** → **Web Service**
2. **Connect GitHub** and select your repository
3. **Configure Service:**
   - **Name**: `green_eyes` or `yirok-django`
   - **Language**: **Python** (not Docker)
   - **Branch**: `main`
   - **Root Directory**: Leave **empty** (blank)
   - **Region**: Virginia (US East)
   - **Build Command**: 
     ```
     pip install -r requirements.txt && python manage.py collectstatic --noinput
     ```
   - **Start Command**: 
     ```
     gunicorn yirok_project.wsgi:application --bind 0.0.0.0:$PORT
     ```
   - **Health Check Path**: `/api/health/`
   - **Pre-Deploy Command**: 
     ```
     python manage.py migrate --noinput
     ```
   - **Auto-Deploy**: On Commit (enabled)
   - **Build Filters**: Leave empty

4. **Add Environment Variables:**
   Click **"Add Environment Variable"** for each:
   
   **Required:**
   - `PYTHON_VERSION` = `3.11`
   - `SECRET_KEY` = (generate secure key - see below)
   - `DEBUG` = `False`
   - `ALLOWED_HOSTS` = `green-eyes.onrender.com`
   
   **Database (from PostgreSQL service):**
   - `DB_NAME` = (from database service)
   - `DB_USER` = (from database service)
   - `DB_PASS` = (from database service)
   - `DB_HOST` = (from database service)
   - `DB_PORT` = `5432`
   
   **Email:**
   - `EMAIL_BACKEND` = `django.core.mail.backends.smtp.EmailBackend`
   - `EMAIL_HOST` = `smtp.gmail.com`
   - `EMAIL_PORT` = `587`
   - `EMAIL_USE_TLS` = `True`
   - `EMAIL_HOST_USER` = `your-email@gmail.com`
   - `EMAIL_HOST_PASSWORD` = `your-gmail-app-password`
   - `DEFAULT_FROM_EMAIL` = `your-email@gmail.com`
   
   **CORS:**
   - `CORS_ALLOWED_ORIGINS` = `https://your-frontend.onrender.com`
   
   **Optional:**
   - `OTP_RATE_LIMIT` = `5`
   - `OTP_EXPIRY_MINUTES` = `10`

5. **Connect Database:**
   - In the service settings, go to **"Connections"**
   - Click **"Connect"** next to your PostgreSQL database
   - Render will auto-populate `DB_*` variables

6. Click **"Create Web Service"**

### Step 3: Create Frontend Service (Optional)

If deploying frontend separately:

1. **New +** → **Web Service**
2. **Settings:**
   - **Name**: `yirok-frontend`
   - **Language**: **Node**
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variable**: 
     - `NEXT_PUBLIC_API_URL` = `https://yirok-django.onrender.com`

---

## 🔑 Generate SECRET_KEY

You need a secure Django SECRET_KEY. Generate one:

**Option 1: Python (recommended)**
```python
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

**Option 2: Online**
- Visit: https://djecrety.ir/
- Copy the generated key

**Option 3: PowerShell**
```powershell
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

---

## ✅ Post-Deployment Checklist

After deployment:

- [ ] Backend health check works: `https://your-backend.onrender.com/api/health/`
- [ ] Database migrations ran successfully (check logs)
- [ ] Static files collected (check logs)
- [ ] Frontend can connect to backend (check browser console)
- [ ] CORS is configured correctly
- [ ] Email sending works (test OTP)
- [ ] Admin panel accessible: `https://your-backend.onrender.com/admin/`

---

## 🐛 Troubleshooting

### Build Fails
- Check logs for error messages
- Verify `requirements.txt` is correct
- Check Python version matches (3.11)

### Database Connection Errors
- Verify database is running
- Check `DB_*` environment variables are set
- Ensure database is in same region as service

### Static Files Not Loading
- Check `collectstatic` ran in build logs
- Verify `STATIC_ROOT` setting
- Check WhiteNoise is installed

### CORS Errors
- Verify `CORS_ALLOWED_ORIGINS` includes frontend URL
- Check frontend URL matches exactly (no trailing slash)
- Restart backend service after changing CORS settings

### Email Not Sending
- Verify SMTP credentials are correct
- Check Gmail App Password (not regular password)
- Test with console backend first: `EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend`

---

## 📝 Important Notes

1. **Free Tier Limitations:**
   - Services sleep after 15 minutes of inactivity
   - First request after sleep takes 30-60 seconds
   - Consider paid plan for production

2. **Database:**
   - Free tier PostgreSQL has 90-day data retention
   - Upgrade to paid for persistent storage

3. **Environment Variables:**
   - Never commit `.env` file to git
   - All secrets go in Render dashboard
   - Use `sync: false` in `render.yaml` for secrets

4. **Custom Domain:**
   - Can add custom domain in service settings
   - Update `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`

---

## 🎉 Success!

Once deployed, your app will be live at:
- Backend: `https://yirok-django.onrender.com`
- Frontend: `https://yirok-frontend.onrender.com` (if deployed)

Test it:
1. Visit frontend URL
2. Register a new user
3. Check email for OTP
4. Login and explore!

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)


