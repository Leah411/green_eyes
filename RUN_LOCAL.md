# How to Run the App Locally

## Backend Service
The backend is a **Django** (Python) REST API that connects to a **PostgreSQL** database.

## Database Connection
The backend connects to PostgreSQL using these environment variables from `.env`:
- `DB_NAME` - Database name (default: `yirok_db`)
- `DB_USER` - Database user (default: `postgres`)
- `DB_PASS` - Database password (default: `postgres`)
- `DB_HOST` - Database host (use `localhost` for local, `db` for Docker)
- `DB_PORT` - Database port (default: `5432`)

## Step-by-Step Setup

### 1. Create `.env` File
Create a `.env` file in the root directory with:
```env
# Database (Local - use localhost)
DB_NAME=yirok_db
DB_USER=postgres
DB_PASS=postgres
DB_HOST=localhost
DB_PORT=5432

# Django
SECRET_KEY=django-insecure-dev-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=*

# Email (console backend for development)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Setup PostgreSQL Database
Make sure PostgreSQL is installed and running, then create the database:
```powershell
# Option 1: Using psql command line
psql -U postgres
CREATE DATABASE yirok_db;
\q

# Option 2: Using pgAdmin or another PostgreSQL client
# Create a database named "yirok_db"
```

### 3. Setup Backend (Django)

**Activate virtual environment:**
```powershell
venv\Scripts\activate.ps1
```

**Install dependencies (if not already installed):**
```powershell
pip install -r requirements.txt
```

**Run database migrations:**
```powershell
python manage.py migrate
```

**Create superuser (optional):**
```powershell
python manage.py createsuperuser
```

**Seed initial data:**
```powershell
python manage.py seed_data
```

**Start Django server:**
```powershell
python manage.py runserver
```
Backend will run on: **http://localhost:8000**

### 4. Setup Frontend (Next.js)

**Navigate to frontend directory:**
```powershell
cd frontend
```

**Install dependencies:**
```powershell
npm install
```

**Start Next.js development server:**
```powershell
npm run dev
```
Frontend will run on: **http://localhost:3000**

## Running Both Services

You need **TWO terminal windows**:

**Terminal 1 - Backend:**
```powershell
cd C:\Users\lvins\yarok_beenaim\green_eyes
venv\Scripts\activate.ps1
python manage.py runserver
```

**Terminal 2 - Frontend:**
```powershell
cd C:\Users\lvins\yarok_beenaim\green_eyes\frontend
npm run dev
```

## Access Points

- **Frontend (Main App)**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/
- **Health Check**: http://localhost:8000/api/health/

## Test Login Credentials

After running `seed_data`, you can login with:
- **Admin**: `admin` / `admin123`
- **Unit Manager**: `unit_manager` / `manager123`
- **Regular User**: `user1` / `user123`

## Troubleshooting

### Database Connection Error
- Make sure PostgreSQL is running
- Check that the database `yirok_db` exists
- Verify `.env` file has correct credentials
- Test connection: `psql -U postgres -d yirok_db`

### Port Already in Use
- Change Django port: `python manage.py runserver 8001`
- Change Next.js port: `npm run dev -- -p 3001`

### Module Not Found
- Make sure virtual environment is activated
- Reinstall: `pip install -r requirements.txt`
- For frontend: `npm install`






