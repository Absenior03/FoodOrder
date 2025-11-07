# Deployment Steps - Food Ordering Platform

## Current Issues & Solutions

### Backend (Render) - "Application Loading" Issue

**Problem:** The backend is stuck on "Application loading"

**Likely Causes:**

1. Build command failing
2. Start command not finding the compiled files
3. Missing environment variables
4. Port configuration issue

**Solution:** Follow the steps below

### Frontend (Vercel) - "No Deployment Available"

**Problem:** Vercel shows no deployment available

**Likely Causes:**

1. Wrong vercel.json configuration (it was pointing to backend)
2. Build directory not specified correctly

**Solution:** Follow the steps below

---

## Step 1: Fix Backend Deployment on Render

### 1.1 Update Your Render Service

Go to your Render dashboard and update these settings:

**Build Command:**

```bash
cd backend && npm install && npm run build
```

**Start Command:**

```bash
cd backend && npm start
```

**Environment Variables (Add these in Render dashboard):**

- `NODE_ENV` = `production`
- `PORT` = `10000` (Render assigns this automatically)
- `MONGODB_URI` = Your MongoDB connection string (from Render database or MongoDB Atlas)
- `JWT_SECRET` = Generate a secure random string (at least 32 characters)
- `BCRYPT_SALT_ROUNDS` = `12`
- `CORS_ORIGIN` = Your Vercel frontend URL (e.g., `https://your-app.vercel.app`)
- `FRONTEND_URL` = Your Vercel frontend URL
- `ALLOWED_ORIGINS` = Your Vercel frontend URL

### 1.2 Get Your MongoDB Connection String

**Option A: Use Render's PostgreSQL (Need to switch to MongoDB)**

- Render doesn't offer MongoDB, so you need MongoDB Atlas

**Option B: Use MongoDB Atlas (Recommended)**

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist all IPs (0.0.0.0/0) for Render
5. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/food_ordering?retryWrites=true&w=majority
   ```
6. Add this as `MONGODB_URI` in Render

### 1.3 Check Backend Logs

After updating, check the logs in Render dashboard to see if there are any errors.

---

## Step 2: Fix Frontend Deployment on Vercel

### 2.1 Update Vercel Configuration

The `vercel.json` file has been updated. Now you need to:

1. **Commit the changes:**

   ```bash
   git add vercel.json
   git commit -m "Fix Vercel configuration for frontend"
   git push
   ```

2. **In Vercel Dashboard:**
   - Go to your project settings
   - Under "Build & Development Settings":
     - **Framework Preset:** Create React App
     - **Build Command:** `cd frontend && npm install && npm run build`
     - **Output Directory:** `frontend/build`
     - **Install Command:** `cd frontend && npm install`

### 2.2 Add Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add:

- `REACT_APP_API_URL` = Your Render backend URL (e.g., `https://food-ordering-backend.onrender.com`)

### 2.3 Redeploy

After adding environment variables, trigger a new deployment:

- Go to Deployments tab
- Click "Redeploy" on the latest deployment
- Or push a new commit to trigger automatic deployment

---

## Step 3: Update CORS Configuration

Once you have both URLs:

### 3.1 Update Backend CORS in Render

Update the environment variables in Render:

- `CORS_ORIGIN` = `https://your-actual-app.vercel.app`
- `FRONTEND_URL` = `https://your-actual-app.vercel.app`
- `ALLOWED_ORIGINS` = `https://your-actual-app.vercel.app`

### 3.2 Update Frontend API URL in Vercel

Update the environment variable in Vercel:

- `REACT_APP_API_URL` = `https://your-actual-backend.onrender.com`

---

## Step 4: Verify Deployment

### 4.1 Test Backend

Visit: `https://your-backend.onrender.com/api/health`

You should see:

```json
{
  "status": "OK",
  "timestamp": "2024-...",
  "environment": "production"
}
```

### 4.2 Test Frontend

Visit: `https://your-app.vercel.app`

You should see the homepage load.

### 4.3 Test Full Integration

1. Try to register a new user
2. Try to login
3. Browse inventory items
4. Add items to cart

---

## Common Issues & Fixes

### Backend Issues

**Issue: "Application failed to start"**

```bash
# Check if build is successful
cd backend && npm run build
```

**Issue: "Cannot find module"**

- Make sure `dist` folder is created during build
- Check that `main` in package.json points to `dist/index.js`

**Issue: "MongoDB connection failed"**

- Verify MongoDB URI is correct
- Check if IP whitelist includes 0.0.0.0/0
- Test connection string locally

**Issue: "Port already in use"**

- Render automatically assigns PORT, don't hardcode it
- Use `process.env.PORT || 5000` in your code

### Frontend Issues

**Issue: "Failed to compile"**

```bash
# Test build locally
cd frontend && npm run build
```

**Issue: "API calls failing"**

- Check REACT_APP_API_URL is set correctly
- Verify CORS is configured on backend
- Check browser console for errors

**Issue: "Environment variables not working"**

- Environment variables must start with `REACT_APP_`
- Redeploy after adding environment variables
- Clear cache and hard reload browser

---

## Quick Checklist

### Backend (Render)

- [ ] Build command: `cd backend && npm install && npm run build`
- [ ] Start command: `cd backend && npm start`
- [ ] MongoDB URI configured
- [ ] JWT_SECRET configured
- [ ] CORS_ORIGIN set to Vercel URL
- [ ] Health endpoint returns 200 OK

### Frontend (Vercel)

- [ ] Build command: `cd frontend && npm install && npm run build`
- [ ] Output directory: `frontend/build`
- [ ] REACT_APP_API_URL set to Render URL
- [ ] Framework preset: Create React App
- [ ] Deployment successful

### Integration

- [ ] Backend health check works
- [ ] Frontend loads without errors
- [ ] API calls work (check Network tab)
- [ ] CORS errors resolved
- [ ] Authentication works
- [ ] WebSocket connection works (if applicable)

---

## Alternative: Deploy Both on Same Platform

If you continue having issues, consider deploying both on the same platform:

### Option 1: Both on Vercel

- Deploy backend as Vercel Serverless Functions
- Deploy frontend as static site
- Simpler CORS configuration

### Option 2: Both on Render

- Deploy backend as Web Service
- Deploy frontend as Static Site
- Both on same domain, easier CORS

### Option 3: Use Railway or Fly.io

- Both support full-stack apps
- Better for Node.js backends
- Free tiers available

---

## Need Help?

If you're still stuck, provide:

1. Your Render backend URL
2. Your Vercel frontend URL
3. Error messages from Render logs
4. Error messages from Vercel logs
5. Browser console errors

I can help debug specific issues!
