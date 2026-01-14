# Initialize Data on Render

## Problem
The database has tables but no data (cities, units, etc.).

## Solution: Run Initialization Commands

### Option 1: Via Render Shell (Quick)

1. Go to **Render Dashboard** → **green_eyes_backend** service
2. Click **"Shell"** tab
3. Run these commands:

```bash
# Load all Israeli cities/locations (hundreds of cities)
python manage.py load_locations

# Seed initial data (units, test users, etc.)
python manage.py seed_data
```

### Option 2: Add to Deployment (Automatic)

Update the pre-deploy command in Render to run initialization after migrations.

**Go to:** Settings → Build & Deploy → Pre-Deploy Command

**Change from:**
```bash
python manage.py migrate --noinput
```

**To:**
```bash
python manage.py migrate --noinput && python manage.py load_locations --clear && python manage.py seed_data
```

**Then:** Trigger a manual deploy.

---

## What Each Command Does

### `python manage.py load_locations`
- Loads **hundreds of Israeli cities**, towns, kibbutzim, and settlements
- Includes Hebrew names
- Categorizes by type (city/town/kibbutz/moshav)
- Groups by region (צפון, מרכז, דרום)

**Options:**
- `--clear` - Delete all existing locations first (useful for fresh start)

### `python manage.py seed_data`
- Creates initial organizational structure (units, branches, sections, teams)
- May create test users (if configured)
- Sets up initial system data

---

## Quick Test After Running

### Check Locations Were Loaded
```bash
python manage.py shell
```

Then:
```python
from core.models import Location
print(f"Total locations: {Location.objects.count()}")
print("Sample cities:")
for loc in Location.objects.filter(location_type='city')[:10]:
    print(f"  - {loc.name_he} ({loc.name})")
```

### Via API
```bash
curl https://green-eyes-uaw4.onrender.com/api/locations/?page_size=10
```

Should return cities like:
```json
{
  "count": 500+,
  "results": [
    {"id": 1, "name": "Tel_Aviv", "name_he": "תל אביב", "location_type": "city"},
    {"id": 2, "name": "Jerusalem", "name_he": "ירושלים", "location_type": "city"},
    ...
  ]
}
```

---

## Recommended: Option 1 (Run Once in Shell)

**Why:** You only need to load data once. No need to run on every deployment.

**Steps:**
1. Open Render Shell
2. Run: `python manage.py load_locations`
3. Wait ~30 seconds (loading hundreds of cities)
4. Run: `python manage.py seed_data` (if needed)
5. Done!

**Refresh your frontend** - cities should appear now.

---

## Troubleshooting

### "Command not found"
Make sure you're in the Shell tab of the **backend service** (not database).

### "No module named core"
You're in the wrong directory. Run:
```bash
cd /opt/render/project/src
python manage.py load_locations
```

### Takes too long
The `load_locations` command loads hundreds of cities. It can take 30-60 seconds. This is normal.

### Already have locations, want to reset
```bash
python manage.py load_locations --clear
```

This deletes all locations and reloads them.

