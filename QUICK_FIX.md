# Quick Fix Guide - Deployment Issues

## 🚨 Your Current Issues

### Backend (Render): "Application Loading" Forever

### Frontend (Vercel): "No Deployment Available"

---

## ⚡ Quick Fix Steps

### Step 1: Fix Backend on Render (5 minutes)

1. **Go to Render Dashboard** → Your Service → Settings

2. **Update Build & Start Commands:**

   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm start`

3. **Add Environment Variables** (Settings → Environment):

   ```
   NODE_ENV=production
   MONGODB_URI=<your-mongodb-atlas-connection-string>
   JWT_SECRET=<generate-random-32-char-string>
   BCRYPT_SALT_ROUNDS=12
   CORS_ORIGIN=https://your-app.vercel.app
   FRONTEND_URL=https://your-app.vercel.app
   ALLOWED_ORIGINS=https://your-app.vercel.app
   ```

4. **Get MongoDB Connection String:**

   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create free cluster (if you haven't)
   - Database Access → Add User
   - Network Access → Add IP: `0.0.0.0/0` (allow all)
   - Connect → Get connection string
   - Replace `<password>` with your actual password

5. **Save and Redeploy**

6. **Check Logs** for any errors

---

### Step 2: Fix Frontend on Vercel (3 minutes)

1. **Commit the updated vercel.json:**

   ```bash
   git add vercel.json
   git commit -m "Fix Vercel config"
   git push
   ```

2. **Go to Vercel Dashboard** → Your Project → Settings → General

3. **Update Build Settings:**

   - Framework Preset: `Create React App`
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/build`
   - Install Command: `cd frontend && npm install`

4. **Add Environment Variable** (Settings → Environment Variables):

   ```
   REACT_APP_API_URL=https://your-backend.onrender.com
   ```

   (Use your actual Render backend URL)

5. **Redeploy:**
   - Go to Deployments tab
   - Click "Redeploy" on latest deployment

---

### Step 3: Update URLs (2 minutes)

Once both are deployed:

1. **Get your URLs:**

   - Backend: `https://your-backend.onrender.com`
   - Frontend: `https://your-app.vercel.app`

2. **Update Backend CORS in Render:**

   - Go to Render → Environment Variables
   - Update `CORS_ORIGIN`, `FRONTEND_URL`, `ALLOWED_ORIGINS` with your actual Vercel URL

3. **Update Frontend API URL in Vercel:**
   - Go to Vercel → Environment Variables
   - Update `REACT_APP_API_URL` with your actual Render URL
   - Redeploy

---

## ✅ Verify It Works

### Test Backend:

```bash
curl https://your-backend.onrender.com/api/health
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

### Test Frontend:

Open `https://your-app.vercel.app` in browser

Should see the homepage load.

---

## 🐛 Still Not Working?

### Backend Issues:

**"Application failed to start"**

- Check Render logs for specific error
- Verify MongoDB connection string is correct
- Make sure JWT_SECRET is set

**"Cannot connect to MongoDB"**

- Verify connection string format
- Check MongoDB Atlas IP whitelist (should include 0.0.0.0/0)
- Test connection string locally

**"Port binding error"**

- Don't worry, Render handles this automatically
- Make sure your code uses `process.env.PORT`

### Frontend Issues:

**"Failed to compile"**

- Check Vercel logs for build errors
- Try building locally: `cd frontend && npm run build`
- Check for TypeScript errors

**"API calls failing (CORS)"**

- Verify CORS_ORIGIN in Render matches your Vercel URL exactly
- Check browser console for specific CORS error
- Make sure both URLs use HTTPS

**"Environment variables not working"**

- Must start with `REACT_APP_`
- Redeploy after adding variables
- Clear browser cache

---

## 📞 Need More Help?

Run the deployment check script:

```bash
./scripts/check-deployment.sh https://your-backend.onrender.com https://your-app.vercel.app
```

This will test:

- Backend health
- Frontend accessibility
- CORS configuration
- API endpoints

---

## 🎯 Common Mistakes to Avoid

1. ❌ Using HTTP instead of HTTPS in URLs
2. ❌ Forgetting to redeploy after changing environment variables
3. ❌ Not whitelisting IPs in MongoDB Atlas
4. ❌ Using wrong build/start commands
5. ❌ Mismatched CORS origins (trailing slash, www vs non-www)

---

## 💡 Pro Tips

1. **Always check logs first** - They tell you exactly what's wrong
2. **Test locally before deploying** - Run `npm run build` in both folders
3. **Use HTTPS everywhere** - Mixed content will cause issues
4. **Keep URLs consistent** - No trailing slashes, consistent subdomain usage
5. **Monitor your free tier limits** - Render and Vercel have usage limits

---

## 🔗 Useful Links

- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Generate JWT Secret](https://www.grc.com/passwords.htm)

---

Good luck! 🚀
