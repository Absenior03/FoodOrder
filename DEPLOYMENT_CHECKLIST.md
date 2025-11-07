# Deployment Checklist - Fix "Route not found" Error

## The Problem

Your deployed website shows "Route not found" for:

- Menu/Inventory pages
- Sign-in/Sign-up

This means the frontend can't reach the backend API.

## Quick Fix Steps

### Step 1: Verify Backend is Running on Render

1. Go to https://dashboard.render.com
2. Find your backend service
3. Check the status - should show **"Live"** (green)
4. If it shows "Deploy failed" or "Deploying":
   - Click on the service
   - Check the logs for errors
   - Common issues:
     - Build failed
     - MongoDB connection failed
     - Missing environment variables

### Step 2: Test Backend Health

Get your Render backend URL (e.g., `https://food-ordering-backend-xxxx.onrender.com`)

Test it:

```bash
curl https://YOUR-BACKEND-URL.onrender.com/api/health
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

If this fails, your backend isn't running properly.

### Step 3: Seed the Database on Render

Your backend needs data! Use Render Shell:

1. Go to Render Dashboard → Your Backend Service
2. Click **"Shell"** tab (top right)
3. Wait for shell to connect
4. Run:
   ```bash
   npm run seed:inventory
   ```
5. You should see: "✅ Successfully inserted XX food items"

### Step 4: Set Environment Variable in Vercel

1. Go to https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add or update:
   - **Name:** `REACT_APP_API_URL`
   - **Value:** Your Render backend URL (e.g., `https://food-ordering-backend-xxxx.onrender.com`)
   - **Important:**
     - Use `https://` (not `http://`)
     - NO trailing slash
     - NO `/api` at the end
5. Click **Save**

### Step 5: Redeploy Frontend

After adding the environment variable:

1. Go to **Deployments** tab in Vercel
2. Click on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

### Step 6: Update CORS on Backend

Make sure your backend allows requests from your Vercel URL:

1. Go to Render Dashboard → Your Backend Service
2. Go to **Environment** tab
3. Update these variables:
   - `CORS_ORIGIN` = `https://your-app.vercel.app`
   - `FRONTEND_URL` = `https://your-app.vercel.app`
   - `ALLOWED_ORIGINS` = `https://your-app.vercel.app`
4. Replace `your-app.vercel.app` with your actual Vercel URL
5. Save (backend will auto-redeploy)

## Verification Steps

### Test 1: Backend Health

```bash
curl https://YOUR-BACKEND-URL.onrender.com/api/health
```

✅ Should return JSON with "status": "OK"

### Test 2: Backend Inventory

```bash
curl https://YOUR-BACKEND-URL.onrender.com/api/inventory/items
```

✅ Should return JSON with array of food items

### Test 3: Frontend Loads

Visit: `https://your-app.vercel.app`
✅ Homepage should load

### Test 4: Menu Page Works

Visit: `https://your-app.vercel.app/menu`
✅ Should show food items, not "Route not found"

### Test 5: Sign-in Works

Click "Sign In" button
✅ Should show login form, not error

## Common Issues & Solutions

### Issue: Backend shows "Deploy failed"

**Check Render logs for:**

- Build errors → Fix TypeScript errors
- MongoDB connection failed → Check MONGODB_URI
- Missing dependencies → Check package.json

**Solution:**

- Fix the error in code
- Push to GitHub
- Render will auto-redeploy

### Issue: Backend is "Live" but health check fails

**Possible causes:**

- Backend crashed after starting
- Port binding issue
- MongoDB disconnected

**Solution:**

- Check Render logs for runtime errors
- Restart the service manually
- Verify MongoDB Atlas is accessible

### Issue: "Route not found" persists after setting REACT_APP_API_URL

**Possible causes:**

- Didn't redeploy after adding variable
- Variable name is wrong (must be exactly `REACT_APP_API_URL`)
- URL format is wrong

**Solution:**

- Verify variable name is correct
- Redeploy in Vercel
- Check browser console for actual API URL being used

### Issue: CORS errors in browser console

**Error:** "Access to fetch at '...' from origin '...' has been blocked by CORS policy"

**Solution:**

- Update CORS_ORIGIN in Render to match your Vercel URL exactly
- Make sure both use HTTPS
- No trailing slashes
- Wait for Render to redeploy

### Issue: Database is empty

**Symptoms:** Menu page loads but shows "No items found"

**Solution:**

- Use Render Shell to seed database:
  ```bash
  npm run seed:inventory
  ```
- Verify with:
  ```bash
  curl https://YOUR-BACKEND-URL.onrender.com/api/inventory/items
  ```

## Environment Variables Reference

### Vercel (Frontend)

```
REACT_APP_API_URL=https://food-ordering-backend-xxxx.onrender.com
```

### Render (Backend)

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/food_ordering?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-random-string-min-32-chars
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app
```

## Quick Debug Commands

### Check what API URL frontend is using:

Open browser console on your Vercel site and run:

```javascript
console.log(process.env.REACT_APP_API_URL);
```

### Check if backend is accessible from browser:

Visit in browser:

```
https://YOUR-BACKEND-URL.onrender.com/api/health
```

### Check CORS headers:

```bash
curl -H "Origin: https://your-app.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://YOUR-BACKEND-URL.onrender.com/api/inventory/items -v
```

## Still Not Working?

If you've done all the above and it still doesn't work:

1. **Share these details:**

   - Your Vercel frontend URL
   - Your Render backend URL
   - Screenshot of Render logs
   - Screenshot of browser console errors

2. **Check these files:**

   - `FIX_MENU_ERROR.md` - Detailed troubleshooting
   - `MENU_ERROR_SUMMARY.md` - Quick summary
   - `FIX_EMPTY_INVENTORY.md` - Database seeding guide

3. **Use the debug page:**
   - Visit: `https://your-app.vercel.app/api-debug`
   - Click "Test All Endpoints"
   - Share the results

---

**Remember:**

- Localhost works because backend is on `http://localhost:5001`
- Production needs `REACT_APP_API_URL` set to your Render URL
- Both frontend and backend must be deployed and running
- Database must be seeded with inventory data
- CORS must allow your Vercel URL

Good luck! 🚀
