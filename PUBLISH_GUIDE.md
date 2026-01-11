# 🚀 How to Publish Your Website - Step by Step Guide

This guide will walk you through publishing your ירוק בעיניים (Green Eyes) website to the internet.

## 📋 Quick Overview

Your website has:
- **Backend**: Django API (Python)
- **Frontend**: Next.js (React/TypeScript)
- **Database**: PostgreSQL

## 🎯 Quick Recommendation

### For 300+ Concurrent Users (Production Load)

**⭐ BEST OPTION: Railway Pro + Vercel Pro**
- **Railway Pro** ($20/month): Handles 300+ concurrent users, auto-scaling, no sleep
- **Vercel Pro** ($20/month): Unlimited bandwidth, advanced analytics, always-on
- **Total**: ~$40/month for production-ready setup
- **Why**: Best performance, reliable, easy scaling

**Alternative: Render.com Starter Plan**
- **Render Starter** ($7/month per service): Backend + Frontend = $14/month
- **PostgreSQL** ($7/month): Database
- **Total**: ~$21/month
- **Why**: Cheaper, but may need multiple instances for 300 users

**⚠️ Important**: Free tiers (Render, Railway free) will NOT handle 300 concurrent users:
- Services sleep after inactivity (15 min on Render)
- Limited CPU/memory resources
- Not suitable for production with high traffic

### For Development/Testing (< 50 users)

**For best performance:** Use **Vercel for frontend** + **Render/Railway for backend**
- ⚡ Vercel is optimized for Next.js (made by Next.js creators)
- 🚀 No sleeping services on Vercel free tier
- 🔄 Automatic deployments
- 📊 Built-in analytics

**For simplicity:** Use **Render.com** (deploys everything together)

You can deploy to:
- **Vercel + Render/Railway** (Best for Next.js frontend) ⭐ **Recommended for small scale**
- **Render.com** (All-in-one, easiest)
- **Railway.app** (All-in-one alternative)

---

## ⚡ Option 1: Vercel (Frontend) + Render/Railway (Backend) - BEST FOR NEXT.JS

**Why Vercel?** Vercel is made by the creators of Next.js, offering:
- ⚡ Lightning-fast performance with edge network
- 🔄 Automatic deployments on every push
- 🆓 Generous free tier (no sleeping services)
- 🎯 Optimized specifically for Next.js
- 📊 Built-in analytics and monitoring

### Step 1: Deploy Backend First (Render or Railway)

Deploy your Django backend using **Option 2** (Render) or **Option 3** (Railway) below. Make sure to note your backend URL (e.g., `https://your-backend.onrender.com`).

### Step 2: Deploy Frontend to Vercel

1. **Create Vercel Account:**
   - Go to [https://vercel.com](https://vercel.com)
   - Sign up with GitHub (free)

2. **Import Your Repository:**
   - Click **"Add New..."** → **"Project"**
   - Import your GitHub repository
   - Vercel will auto-detect it's a Next.js project

3. **Configure Project Settings:**
   - **Root Directory**: `frontend` (important!)
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

4. **Set Environment Variable:**
   - Go to **Settings** → **Environment Variables**
   - Add:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
     ```
   - Replace with your actual backend URL from Step 1

5. **Deploy:**
   - Click **"Deploy"**
   - Vercel will build and deploy automatically
   - Your site will be live in ~2 minutes!

### Step 3: Update Backend CORS

After getting your Vercel frontend URL (e.g., `https://your-app.vercel.app`):

1. Go to your backend service (Render/Railway)
2. Update `CORS_ALLOWED_ORIGINS` environment variable:
   ```
   CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
   ```
3. Redeploy the backend service

### Step 4: Access Your Website

- **Frontend**: `https://your-app.vercel.app` (Vercel)
- **Backend API**: `https://your-backend.onrender.com` (Render/Railway)
- **Admin Panel**: `https://your-backend.onrender.com/admin`

**✅ Benefits of this setup:**
- Frontend gets Vercel's excellent Next.js optimization
- Backend stays on Render/Railway (better for Django)
- Both services don't sleep (Vercel free tier is always-on)
- Automatic deployments on every git push

---

## 🌟 Option 2: Deploy to Render.com (All-in-One - Easiest)

### Step 1: Prepare Your Code

1. **Make sure your code is on GitHub:**
   ```bash
   # If not already on GitHub, create a repository and push:
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

### Step 2: Create Render Account

1. Go to [https://render.com](https://render.com)
2. Sign up for a free account (use GitHub to connect)

### Step 3: Deploy Using Blueprint

1. In Render dashboard, click **"New +"** → **"Blueprint"**
2. Connect your GitHub repository
3. Render will automatically detect `render.yaml` in your repo
4. Click **"Apply"** - Render will create:
   - PostgreSQL database
   - Django backend service
   - Next.js frontend service

### Step 4: Configure Environment Variables

After services are created, you need to set environment variables:

#### For Django Backend Service (`yirok-django`):

Go to the service → **Environment** tab → Add these variables:

**Required:**
```
SECRET_KEY=your-very-long-random-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-app-name.onrender.com
```

**Email Configuration** (choose one option):

**Option A: Gmail (if you have Gmail app password)**
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

**Option B: SendGrid (recommended for production)**
```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

**CORS (Important!):**
```
CORS_ALLOWED_ORIGINS=https://your-frontend-service.onrender.com
```

**Note:** Database variables (`DB_NAME`, `DB_USER`, etc.) are automatically set by Render from the PostgreSQL service.

#### For Frontend Service (`yirok-frontend`):

Go to the service → **Environment** tab → Add:

```
NEXT_PUBLIC_API_URL=https://your-django-service.onrender.com
```

**Important:** Replace `your-django-service` with the actual URL of your Django service (you'll see it in the Render dashboard).

### Step 5: Deploy

1. Render will automatically start building and deploying
2. Wait for both services to show "Live" status (green)
3. This may take 5-10 minutes on first deploy

### Step 6: Initial Setup

After deployment, you need to set up the database:

1. Go to your Django service in Render
2. Click **"Shell"** tab (or use SSH)
3. Run these commands:

```bash
# Create superuser (admin account)
python manage.py createsuperuser

# Create user groups
python manage.py create_groups

# Seed initial data (optional)
python manage.py seed_data
```

### Step 7: Access Your Website

- **Frontend**: `https://your-frontend-service.onrender.com`
- **Backend API**: `https://your-django-service.onrender.com`
- **Admin Panel**: `https://your-django-service.onrender.com/admin`

---

## 🚂 Option 3: Deploy to Railway.app (All-in-One Alternative)

### Step 1: Create Railway Account

1. Go to [https://railway.app](https://railway.app)
2. Sign up with GitHub

### Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository

### Step 3: Add PostgreSQL Database

1. Click **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway will automatically provide connection details

### Step 4: Add Django Backend Service

1. Click **"New"** → **"GitHub Repo"**
2. Select your repository
3. Railway will detect it's a Python project
4. In **Settings** → **Deploy**:
   - **Root Directory**: Leave empty (root)
   - **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
   - **Start Command**: `python manage.py migrate && gunicorn yirok_project.wsgi:application --bind 0.0.0.0:$PORT`

### Step 5: Add Next.js Frontend Service

1. Click **"New"** → **"GitHub Repo"** (again)
2. Select the same repository
3. In **Settings** → **Deploy**:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### Step 6: Configure Environment Variables

#### For Django Service:

Go to **Variables** tab → Add all the same variables as Render (see Step 4 above)

**Link Database Variables:**
- Click **"Add Variable"** → **"Reference"**
- Select your PostgreSQL service
- Add references for: `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT`

#### For Frontend Service:

Add:
```
NEXT_PUBLIC_API_URL=https://your-django-service.railway.app
```

### Step 7: Deploy

Railway will automatically deploy. Wait for services to be "Active".

### Step 8: Initial Setup

Use Railway's shell or connect via CLI:

```bash
railway run python manage.py createsuperuser
railway run python manage.py create_groups
railway run python manage.py seed_data
```

---

## 🔧 Generating a Secret Key

For the `SECRET_KEY` environment variable, generate a secure random key:

**Option 1: Using Python**
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

**Option 2: Using Django**
```bash
python manage.py shell
>>> from django.core.management.utils import get_random_secret_key
>>> print(get_random_secret_key())
```

Copy the output and use it as your `SECRET_KEY`.

---

## ✅ Post-Deployment Checklist

After deployment, verify:

- [ ] Frontend loads at the URL
- [ ] Can register a new user
- [ ] Can request OTP code (check email)
- [ ] Can verify OTP and login
- [ ] Admin panel accessible at `/admin`
- [ ] Database migrations completed
- [ ] Static files loading correctly
- [ ] CORS working (frontend can call backend API)

---

## 🐛 Troubleshooting

### Database Connection Errors

- Verify database credentials are correct
- Check database service is running
- Ensure database variables are linked correctly

### Email Not Sending

- Verify email service credentials
- Check spam folder
- Test with console backend first: `EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend`

### CORS Errors

- Make sure `CORS_ALLOWED_ORIGINS` includes your exact frontend URL (with `https://`)
- Check `NEXT_PUBLIC_API_URL` in frontend matches backend URL exactly

### Build Failures

- Check build logs in the platform dashboard
- Verify all dependencies are in `requirements.txt` and `package.json`
- Ensure Python/Node versions are compatible

### Static Files Not Loading

- Run `python manage.py collectstatic --noinput` manually
- Check WhiteNoise is in `INSTALLED_APPS` (it should be)

---

## 📝 Important Notes

1. **Free Tier Limitations:**
   - Render: Services sleep after 15 minutes of inactivity (free tier)
   - Railway: Limited hours per month on free tier
   - Consider upgrading for production use

2. **Custom Domain:**
   - Both platforms support custom domains
   - Add your domain in service settings
   - Update `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` accordingly

3. **Environment Variables:**
   - Never commit `.env` files to Git
   - Always set sensitive variables in platform dashboards

4. **Database Backups:**
   - Both platforms offer automated backups (may require paid plan)
   - Set up regular backups for production

---

## 🆘 Need Help?

- Check the detailed deployment docs: `DEPLOYMENT.md`
- Review Render docs: https://render.com/docs
- Review Railway docs: https://docs.railway.app
- Check application logs in platform dashboard

---

**Good luck with your deployment! 🎉**

