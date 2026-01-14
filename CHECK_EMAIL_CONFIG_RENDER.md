# איפה לבדוק תצורת Email ב-Render

## שלב 1: גש ל-Backend Service

1. לך ל-[Render Dashboard](https://dashboard.render.com)
2. מצא את ה-Backend Service שלך (כנראה `green-eyes` או `yirok-django`)
3. לחץ עליו

## שלב 2: פתח Environment Variables

1. בחלק העליון של הדף, תראה טאבים:
   - **Overview**
   - **Logs**
   - **Environment** ← **לחץ כאן!**
   - **Settings**
   - וכו'

2. לחץ על **Environment** tab

## שלב 3: בדוק משתני Email

עכשיו תראה רשימה של כל משתני הסביבה. חפש את המשתנים הבאים:

### משתנים שצריכים להיות:

```
EMAIL_BACKEND
EMAIL_HOST
EMAIL_PORT
EMAIL_USE_TLS
EMAIL_HOST_USER
EMAIL_HOST_PASSWORD
DEFAULT_FROM_EMAIL
```

### מה צריך להיות הערך של כל אחד:

| משתנה | ערך דוגמה | הערות |
|-------|-----------|-------|
| `EMAIL_BACKEND` | `django.core.mail.backends.smtp.EmailBackend` | חייב להיות זה |
| `EMAIL_HOST` | `smtp.gmail.com` | או `smtp.sendgrid.net` |
| `EMAIL_PORT` | `587` | בדרך כלל 587 |
| `EMAIL_USE_TLS` | `True` | חייב להיות `True` |
| `EMAIL_HOST_USER` | `your-email@gmail.com` | כתובת האימייל שלך |
| `EMAIL_HOST_PASSWORD` | `abcdefghijklmnop` | Gmail App Password (16 תווים) |
| `DEFAULT_FROM_EMAIL` | `your-email@gmail.com` | חייב להיות זהה ל-EMAIL_HOST_USER |

## שלב 4: אם משתנה חסר

אם אחד מהמשתנים חסר:

1. לחץ על **"Add Environment Variable"** (כפתור כחול למעלה)
2. הזן את ה-Key (השם) וה-Value (הערך)
3. לחץ **"Save Changes"**

## שלב 5: אם צריך לשנות משתנה

1. מצא את המשתנה ברשימה
2. לחץ עליו (או על עיפרון/Edit)
3. שנה את ה-Value
4. לחץ **"Save Changes"**

## שלב 6: אחרי שינוי - Redeploy

אחרי שמירת שינויים:
- Render יבצע Redeploy אוטומטית
- המתן 2-3 דקות
- או לחץ על **"Manual Deploy"** → **"Deploy latest commit"**

## דוגמה: תצורת Gmail מלאה

אם אתה משתמש ב-Gmail, כל המשתנים צריכים להיות:

```
EMAIL_BACKEND = django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = your-email@gmail.com
EMAIL_HOST_PASSWORD = xxxx xxxx xxxx xxxx (16 תווים, ללא רווחים)
DEFAULT_FROM_EMAIL = your-email@gmail.com
```

**חשוב:**
- `EMAIL_HOST_USER` ו-`DEFAULT_FROM_EMAIL` **חייבים להיות זהים**
- `EMAIL_HOST_PASSWORD` חייב להיות **Gmail App Password**, לא הסיסמה הרגילה
- App Password נראה כך: `abcd efgh ijkl mnop` (16 תווים, אפשר עם או בלי רווחים)

## פתרון זמני: Console Backend

אם אתה רוצה לבדוק שהכל עובד בלי Email:

1. שנה `EMAIL_BACKEND` ל:
   ```
   django.core.mail.backends.console.EmailBackend
   ```
2. שמור והפעל מחדש
3. עכשיו ה-OTP יופיע ב-Logs במקום להישלח ב-Email

## איפה לראות Logs

אם אתה רוצה לראות שגיאות Email:

1. Backend Service → **Logs** tab
2. חפש שגיאות שקשורות ל:
   - `email`
   - `smtp`
   - `request-otp`
   - `send_mail`

## סיכום - איפה לבדוק

1. **Render Dashboard** → **Backend Service** → **Environment** tab
2. חפש את כל משתני ה-Email ברשימה
3. ודא שכולם מוגדרים נכון
4. שמור שינויים
5. המתן ל-Redeploy

## אם עדיין לא עובד

שלח לי:
1. רשימה של כל משתני ה-Email שיש לך (בלי הסיסמאות!)
2. מה השגיאה ב-Logs?
3. האם אתה משתמש ב-Gmail או שירות אחר?


