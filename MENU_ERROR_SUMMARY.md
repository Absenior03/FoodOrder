# Menu Page Error - Quick Summary

## The Problem

Menu page shows: **"Error Loading Inventory - Route not found"**

## Most Likely Cause

The `REACT_APP_API_URL` environment variable is **not set** or **set incorrectly** in Vercel.

## Quick Fix (5 minutes)

### 1. Get Your Backend URL

- Go to Render Dashboard
- Find your backend service
- Copy the URL (looks like: `https://food-ordering-backend-xxxx.onrender.com`)

### 2. Set Environment Variable in Vercel

- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add or update:
  - **Name:** `REACT_APP_API_URL`
  - **Value:** Your Render backend URL (from step 1)
  - **Environments:** Check all (Production, Preview, Development)
- Click Save

### 3. Redeploy

- Go to Deployments tab
- Click "Redeploy" on latest deployment
- Wait for completion

### 4. Test

Visit: `https://your-app.vercel.app/menu`

Should now load inventory items!

## Verify It's Working

### Test Backend First:

```bash
curl https://your-backend-url.onrender.com/api/health
```

Should return JSON with `"status": "OK"`

### Test Frontend:

Visit: `https://your-app.vercel.app/api-debug`

Click "Test All Endpoints" - all should show ✅ Success

## Common Mistakes

❌ **Wrong:** `http://backend.onrender.com` (http instead of https)
❌ **Wrong:** `https://backend.onrender.com/` (trailing slash)
❌ **Wrong:** `https://backend.onrender.com/api` (includes /api)
❌ **Wrong:** `https://your-backend.onrender.com` (placeholder URL)

✅ **Correct:** `https://food-ordering-backend-abc123.onrender.com`

## Still Not Working?

1. Check backend is running (visit the URL in browser)
2. Check Vercel build logs for errors
3. Check browser console (F12) for specific error
4. Read `FIX_MENU_ERROR.md` for detailed troubleshooting

## Files Created to Help

- `FIX_MENU_ERROR.md` - Detailed troubleshooting guide
- `frontend/src/components/debug/ApiDebug.tsx` - API testing tool
- Visit `/api-debug` route to test your API connection

---

**TL;DR:** Set `REACT_APP_API_URL` in Vercel to your Render backend URL, then redeploy.
