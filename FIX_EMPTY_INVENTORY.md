# Fix Empty Inventory Issue

## The Problem

- **Localhost:** "Failed to retrieve food items" - Backend is running but database is empty
- **Vercel/Render:** "Route not found" - Environment variable issue OR backend database is empty

## Solution: Seed the Database

### For Localhost (Development)

#### Step 1: Make sure backend is running

```bash
cd backend
npm run dev
```

#### Step 2: Seed the inventory (in a new terminal)

```bash
cd backend
npm run seed:inventory
```

You should see:

```
✅ Successfully seeded 50 food items
✅ Database seeded successfully!
```

#### Step 3: Verify it worked

```bash
# Test the API
curl http://localhost:5001/api/inventory/items
```

Should return a JSON array with food items.

#### Step 4: Refresh your frontend

Visit `http://localhost:3000/menu` - should now show items!

---

### For Production (Render)

Your Render backend also needs data! Here's how to seed it:

#### Option 1: Seed via Render Shell (Recommended)

1. Go to Render Dashboard → Your Backend Service
2. Click "Shell" tab (top right)
3. Wait for shell to connect
4. Run:
   ```bash
   cd backend
   npm run seed:inventory
   ```

#### Option 2: Seed via API endpoint (if you create one)

Create a protected admin endpoint to seed data remotely.

#### Option 3: Use MongoDB Atlas directly

1. Go to MongoDB Atlas
2. Click "Browse Collections"
3. Manually import data or use MongoDB Compass

---

## Quick Fix Commands

### Clear and reseed (if you need to start fresh)

```bash
cd backend
npm run seed:inventory:clear
npm run seed:inventory
```

### Check what's in the database

```bash
# Using MongoDB shell
mongo "your-mongodb-uri"
use food_ordering
db.fooditems.count()
db.fooditems.find().limit(5)
```

---

## Verify Everything Works

### Test Backend Locally

```bash
# Health check
curl http://localhost:5001/api/health

# Get items
curl http://localhost:5001/api/inventory/items

# Get categories
curl http://localhost:5001/api/inventory/categories
```

### Test Backend on Render

```bash
# Replace with your actual URL
curl https://your-backend.onrender.com/api/health
curl https://your-backend.onrender.com/api/inventory/items
curl https://your-backend.onrender.com/api/inventory/categories
```

---

## Common Issues

### "Cannot connect to MongoDB"

**Localhost:**

- Make sure MongoDB is running: `brew services start mongodb-community` (Mac)
- Or use MongoDB Atlas connection string in `.env`

**Render:**

- Check MONGODB_URI environment variable is set
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0

### "Seed script fails"

Check:

- MongoDB connection string is correct
- Database user has write permissions
- Network connectivity to MongoDB

### "Items still not showing"

1. Check backend logs for errors
2. Verify items were actually inserted:
   ```bash
   # In MongoDB shell
   db.fooditems.count()
   ```
3. Check API response:
   ```bash
   curl http://localhost:5001/api/inventory/items | jq
   ```

---

## Production Deployment Checklist

For your Render backend to work properly:

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with read/write permissions
- [ ] IP whitelist includes 0.0.0.0/0
- [ ] MONGODB_URI set in Render environment variables
- [ ] Backend deployed and running
- [ ] Database seeded with inventory items
- [ ] API endpoints return data
- [ ] CORS configured for Vercel frontend
- [ ] Frontend REACT_APP_API_URL points to Render backend

---

## Automated Seeding (Optional)

You can modify your backend to auto-seed on first run:

```typescript
// In backend/src/index.ts
const startServer = async () => {
  // ... existing code ...

  // Auto-seed if database is empty
  const itemCount = await FoodItem.countDocuments();
  if (itemCount === 0) {
    console.log("📦 Database is empty, seeding...");
    await seedInventory();
    console.log("✅ Database seeded!");
  }
};
```

---

## Summary

**Localhost Fix:**

```bash
cd backend
npm run seed:inventory
```

**Render Fix:**

1. Use Render Shell to run seed script
2. Or connect to MongoDB Atlas and import data
3. Verify with: `curl https://your-backend.onrender.com/api/inventory/items`

**Vercel Fix:**

1. Make sure REACT_APP_API_URL is set correctly
2. Redeploy after setting environment variable
3. Backend must have data (see above)

After seeding, both localhost and production should show inventory items!
