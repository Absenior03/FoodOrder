# Fix "Route not found" Error on Menu Page

## Problem

The menu page shows: "Error Loading Inventory - Route not found"

## Root Cause

The frontend is trying to call the backend API, but either:

1. The `REACT_APP_API_URL` environment variable is not set in Vercel
2. The URL is incorrect
3. The backend routes aren't working

## Quick Fix

### Step 1: Check Your Environment Variable in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Look for `REACT_APP_API_URL`
3. It should be set to your Render backend URL (e.g., `https://food-ordering-backend-xxxx.onrender.com`)

**Important:** The URL should:

- ✅ Start with `https://` (not `http://`)
- ✅ NOT end with a trailing slash
- ✅ NOT include `/api` at the end
- ✅ Be your actual Render URL (not a placeholder)

**Correct Example:**

```
REACT_APP_API_URL=https://food-ordering-backend-abc123.onrender.com
```

**Wrong Examples:**

```
❌ http://food-ordering-backend-abc123.onrender.com  (http instead of https)
❌ https://food-ordering-backend-abc123.onrender.com/  (trailing slash)
❌ https://food-ordering-backend-abc123.onrender.com/api  (includes /api)
❌ https://your-backend.onrender.com  (placeholder, not real URL)
```

### Step 2: Update or Add the Environment Variable

If it's missing or wrong:

1. In Vercel Dashboard → Settings → Environment Variables
2. Click "Add New" or "Edit" on existing variable
3. Name: `REACT_APP_API_URL`
4. Value: Your actual Render backend URL
5. Select all environments (Production, Preview, Development)
6. Click "Save"

### Step 3: Redeploy

After updating environment variables:

1. Go to Deployments tab
2. Click on the latest deployment
3. Click "Redeploy"
4. Wait for deployment to complete

### Step 4: Verify Backend is Working

Before testing frontend, make sure backend works:

```bash
# Replace with YOUR actual Render URL
curl https://your-actual-backend.onrender.com/api/health
```

Should return:

```json
{
  "status": "OK",
  "message": "Food Ordering Platform API is running",
  "timestamp": "...",
  "environment": "production"
}
```

If this fails, fix the backend first!

### Step 5: Test the API Connection

After redeploying, visit your frontend:

```
https://your-app.vercel.app/api-debug
```

This debug page will test:

- Health check endpoint
- Inventory items endpoint
- Categories endpoint

Click "Test All Endpoints" to see what's working.

### Step 6: Check Browser Console

1. Open your menu page: `https://your-app.vercel.app/menu`
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for errors

Common errors you might see:

**"Failed to fetch"**

- Backend is down or URL is wrong
- Check REACT_APP_API_URL

**"CORS error"**

- Backend CORS_ORIGIN doesn't match your Vercel URL
- Update CORS_ORIGIN in Render environment variables

**"404 Not Found"**

- API endpoint doesn't exist
- Check backend logs in Render

**"Network Error"**

- Backend isn't responding
- Check if backend is running in Render

## Alternative: Check Locally

To verify the issue is with environment variables:

1. Clone your repo locally
2. Create `frontend/.env.local`:
   ```
   REACT_APP_API_URL=https://your-actual-backend.onrender.com
   ```
3. Run: `cd frontend && npm start`
4. Visit: `http://localhost:3000/menu`

If it works locally but not on Vercel, it's definitely an environment variable issue.

## Common Mistakes

1. **Forgetting to redeploy after changing environment variables**

   - Environment variables only take effect after redeployment

2. **Using the wrong URL format**

   - Must be HTTPS
   - No trailing slash
   - No /api suffix

3. **Backend not running**

   - Check Render dashboard
   - Look at backend logs

4. **CORS not configured**

   - Backend needs CORS_ORIGIN set to your Vercel URL

5. **MongoDB not connected**
   - Backend might be running but can't access database
   - Check Render logs for MongoDB errors

## Debug Checklist

- [ ] REACT_APP_API_URL is set in Vercel
- [ ] URL format is correct (https, no trailing slash)
- [ ] Redeployed after changing environment variable
- [ ] Backend health check returns 200 OK
- [ ] Backend logs show no errors
- [ ] CORS is configured correctly
- [ ] MongoDB is connected
- [ ] Browser console shows no errors

## Still Not Working?

1. **Check Vercel Build Logs:**

   - Go to Deployments → Latest Deployment → Building
   - Look for environment variable warnings

2. **Check Vercel Function Logs:**

   - Go to Deployments → Latest Deployment → Functions
   - Look for runtime errors

3. **Check Render Logs:**

   - Go to Render Dashboard → Your Service → Logs
   - Look for API request errors

4. **Test with curl:**

   ```bash
   # Test from command line
   curl https://your-backend.onrender.com/api/inventory/items
   ```

5. **Check Network Tab:**
   - Open DevTools → Network tab
   - Reload menu page
   - Click on failed request
   - Check Request URL and Response

## Quick Test Commands

```bash
# Test backend health
curl https://your-backend.onrender.com/api/health

# Test inventory endpoint
curl https://your-backend.onrender.com/api/inventory/items

# Test categories endpoint
curl https://your-backend.onrender.com/api/inventory/categories

# Test with CORS headers
curl -H "Origin: https://your-app.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://your-backend.onrender.com/api/inventory/items
```

## Need More Help?

Provide:

1. Your Vercel frontend URL
2. Your Render backend URL
3. Screenshot of the error
4. Browser console errors
5. Result of: `curl https://your-backend.onrender.com/api/health`

I can help debug from there!
