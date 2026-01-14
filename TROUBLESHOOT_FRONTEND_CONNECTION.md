# פתרון בעיית חיבור בין Frontend ל-Backend

## הבעיה
השגיאה: "לא ניתן להתחבר לשרת. אנא ודא שהשרת פועל ונסה שוב."

## סיבות אפשריות

### 1. משתנה סביבה לא מוגדר נכון

**בדוק ב-Render Dashboard:**

1. לך ל-**Frontend Service** → **Environment** tab
2. ודא שיש משתנה:
   ```
   NEXT_PUBLIC_API_URL=https://green-eyes-uaw4.onrender.com
   ```
3. **חשוב:** ללא `http://` או `https://` בסוף!
4. **חשוב:** חייב להתחיל ב-`https://`

### 2. Backend לא פועל

**בדוק:**
- לך ל-Backend service ב-Render
- ודא שהוא במצב **Live** (לא Sleeping)
- בדוק את ה-Logs אם יש שגיאות

**בדיקה מהירה:**
פתח בדפדפן:
```
https://green-eyes-uaw4.onrender.com/api/health/
```

אם אתה רואה:
```json
{"status":"healthy","timestamp":"...","version":"1.0.0"}
```
אז ה-Backend פועל ✅

### 3. CORS לא מוגדר נכון

**בדוק ב-Backend Service:**

1. לך ל-**Django Backend Service** → **Environment** tab
2. מצא `CORS_ALLOWED_ORIGINS`
3. ודא שהוא כולל את כתובת ה-Frontend:
   ```
   https://yirok-frontend.onrender.com
   ```
   או:
   ```
   https://your-frontend-url.onrender.com
   ```

4. **חשוב:** ללא `/` בסוף!
5. אם יש כמה כתובות, הפרד בפסיק:
   ```
   https://frontend1.onrender.com,https://frontend2.onrender.com
   ```

### 4. Frontend מנסה להתחבר ל-localhost

**בדוק בקוד:**
הקוד ב-`frontend/lib/api.ts` משתמש ב:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

אם `NEXT_PUBLIC_API_URL` לא מוגדר, הוא ינסה להתחבר ל-localhost (לא יעבוד ב-production).

## פתרונות

### פתרון 1: בדוק משתני סביבה

**ב-Frontend Service:**
1. Render Dashboard → Frontend Service → Environment
2. ודא שיש:
   - `NEXT_PUBLIC_API_URL` = `https://green-eyes-uaw4.onrender.com`
   - `NODE_VERSION` = `18`

**ב-Backend Service:**
1. Render Dashboard → Backend Service → Environment
2. ודא שיש:
   - `CORS_ALLOWED_ORIGINS` = `https://your-frontend-url.onrender.com`

### פתרון 2: Rebuild Frontend

אחרי שינוי משתני סביבה:
1. לך ל-Frontend Service
2. לחץ על **"Manual Deploy"** → **"Deploy latest commit"**
3. זה יבנה מחדש עם המשתנים החדשים

**חשוב:** Next.js בונה את `NEXT_PUBLIC_*` משתנים בזמן ה-build, אז צריך rebuild!

### פתרון 3: בדוק Console בדפדפן

1. פתח את ה-Frontend URL
2. לחץ F12 (Developer Tools)
3. לך ל-**Console** tab
4. חפש שגיאות כמו:
   - `Network Error`
   - `CORS policy`
   - `Failed to fetch`
   - כתובת URL שגויה

### פתרון 4: בדוק Network Tab

1. F12 → **Network** tab
2. רענן את הדף
3. חפש בקשות ל-API
4. בדוק:
   - האם הבקשה נשלחת לכתובת הנכונה?
   - מה קוד התגובה? (200 = טוב, 404/500 = בעיה)
   - האם יש שגיאת CORS?

## בדיקות מהירות

### בדיקה 1: Backend פועל?
```
https://green-eyes-uaw4.onrender.com/api/health/
```
צריך להחזיר: `{"status":"healthy",...}`

### בדיקה 2: Frontend יכול לגשת ל-Backend?
פתח ב-Console:
```javascript
fetch('https://green-eyes-uaw4.onrender.com/api/health/')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

### בדיקה 3: CORS מוגדר?
פתח ב-Console:
```javascript
fetch('https://green-eyes-uaw4.onrender.com/api/health/', {
  method: 'GET',
  headers: { 'Origin': 'https://your-frontend-url.onrender.com' }
})
  .then(r => console.log('CORS OK:', r.headers.get('access-control-allow-origin')))
  .catch(console.error)
```

## סדר פעולות מומלץ

1. ✅ בדוק ש-Backend פועל (`/api/health/`)
2. ✅ בדוק `NEXT_PUBLIC_API_URL` ב-Frontend Service
3. ✅ בדוק `CORS_ALLOWED_ORIGINS` ב-Backend Service
4. ✅ Rebuild Frontend (Manual Deploy)
5. ✅ בדוק Console בדפדפן לשגיאות
6. ✅ בדוק Network tab לראות מה קורה

## אם עדיין לא עובד

**שלח לי:**
1. מה כתובת ה-Frontend URL?
2. מה כתובת ה-Backend URL?
3. מה רואים ב-Console (F12)?
4. מה רואים ב-Network tab?
5. מה המשתנים ב-Environment של שני השירותים?


