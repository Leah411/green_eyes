# Quick Start Guide - ירוק בעיניים

## 🚀 Fastest Way: Docker (Recommended)

### Step 1: Create Environment File

First, create a `.env` file in the root directory:

```bash
# Copy the example (if it exists) or create manually
# On Windows PowerShell:
Copy-Item .env.example .env
# Or create it manually with these values:
```

Create `.env` with these minimum values:

```env
# Database (Docker will use these)
DB_NAME=yirok_db
DB_USER=postgres
DB_PASS=postgres
DB_HOST=db
DB_PORT=5432

# Django
SECRET_KEY=your-secret-key-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=*

# Email (console backend for development)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Step 2: Start Everything

```bash
docker-compose up --build
```

This will:
- Start PostgreSQL database
- Build and start Django backend (port 8000)
- Build and start Next.js frontend (port 3000)

**Wait 2-3 minutes** for the first build to complete.

### Step 3: Initialize Database

Open a **new terminal** (keep Docker running) and run:

```bash
# Run migrations
docker-compose exec web python manage.py migrate

# Create superuser (follow prompts)
docker-compose exec web python manage.py createsuperuser

# Seed sample data (creates groups, units, and test users)
docker-compose exec web python manage.py seed_data
```

### Step 4: Access the Application

- **Frontend (Main App)**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/
- **Health Check**: http://localhost:8000/api/health/

### Step 5: Test Login

After seeding data, you can login with:
- **Admin**: `admin` / `admin123` (or the password you set)
- **Unit Manager**: `unit_manager` / `manager123`
- **Regular User**: `user1` / `user123`

---

## 📋 Alternative: Run Locally (Without Docker)

### Backend Setup

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Create `.env` file** (see Step 1 above, but change `DB_HOST=localhost`)

4. **Create PostgreSQL database:**
   ```bash
   psql -U postgres
   CREATE DATABASE yirok_db;
   \q
   ```

5. **Run migrations:**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py seed_data
   ```

6. **Start Django server:**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Navigate to frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start Next.js:**
   ```bash
   npm run dev
   ```

4. **Access**: http://localhost:3000

---

## 🧪 Test the Application

### 1. Register a New User

Go to http://localhost:3000 and click "Register":
- Fill in username, email, password
- Submit → Creates AccessRequest (pending approval)

### 2. Approve User (as Admin)

1. Go to http://localhost:8000/admin/
2. Login with superuser credentials
3. Navigate to "Access Requests"
4. Click on pending request → Click "Approve"
5. User will receive OTP via email (check console logs)

### 3. User Requests OTP

1. User goes to http://localhost:3000
2. Clicks "Request OTP" or goes to `/verify-otp`
3. Enters email → Receives OTP (check console/email)

### 4. User Verifies OTP

1. Enters OTP code
2. Gets JWT tokens → Redirected to dashboard
3. Can now submit availability reports

---

## 🛠 Common Commands

### Docker Commands

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f web
docker-compose logs -f frontend

# Run Django commands
docker-compose exec web python manage.py <command>

# Access Django shell
docker-compose exec web python manage.py shell

# Rebuild after changes
docker-compose up --build
```

### Useful Django Commands

```bash
# Create migrations
python manage.py makemigrations

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Seed data
python manage.py seed_data

# Create groups
python manage.py create_groups

# Run tests
python manage.py test
```

---

## 🐛 Troubleshooting

### Port Already in Use

**Port 8000 (Django):**
```bash
# Find what's using it
netstat -ano | findstr :8000  # Windows
lsof -i :8000  # Mac/Linux

# Or change port in docker-compose.yml
ports:
  - "8001:8000"  # Use 8001 instead
```

**Port 3000 (Frontend):**
```bash
# Change in docker-compose.yml
ports:
  - "3001:3000"  # Use 3001 instead
```

### Database Connection Errors

```bash
# Check if database container is running
docker-compose ps

# Restart database
docker-compose restart db

# Check database logs
docker-compose logs db
```

### Frontend Can't Connect to Backend

1. Check `NEXT_PUBLIC_API_URL` in `.env` matches backend URL
2. Check CORS settings in Django settings
3. Verify backend is running: http://localhost:8000/api/health/

### Migration Errors

```bash
# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up --build
docker-compose exec web python manage.py migrate
```

### Module Not Found Errors

```bash
# Reinstall dependencies
docker-compose exec web pip install -r requirements.txt

# Or rebuild
docker-compose up --build
```

---

## 📝 Next Steps

1. **Configure Email** (for production):
   - Update `.env` with SendGrid/Mailgun credentials
   - Change `EMAIL_BACKEND` to SMTP

2. **Set Strong Secret Key**:
   ```bash
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```

3. **Review Sample Data**:
   - Check admin panel for created users and units
   - Test different user roles

4. **Explore API**:
   - Visit http://localhost:8000/api/ for API root
   - Check http://localhost:8000/api/health/ for health status

---

## ✅ Quick Verification Checklist

- [ ] Docker containers are running (`docker-compose ps`)
- [ ] Backend accessible: http://localhost:8000/api/health/
- [ ] Frontend accessible: http://localhost:3000
- [ ] Admin panel accessible: http://localhost:8000/admin/
- [ ] Can register new user
- [ ] Can approve access request
- [ ] Can request and verify OTP
- [ ] Can submit availability report

---

**Need help?** Check the logs:
```bash
docker-compose logs -f
```
