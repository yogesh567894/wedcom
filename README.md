# Organization Management Service

Multi-tenant Node.js backend where each organization gets its own MongoDB collection. Create an org, it spins up a new collection. Simple as that.

## How to Run This

1. **Clone it**
```bash
git clone https://github.com/yogesh567894/wedcom.git
cd wedcom
```

2. **Install stuff**
```bash
npm install
```

3. **Setup MongoDB**

Get a free database at [MongoDB Atlas](https://mongodb.com/cloud/atlas) (no install needed) or run MongoDB locally.

4. **Create `.env` file**
```bash
PORT=3000
MONGO_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/org_management_service
JWT_SECRET=put_any_random_string_here
```

5. **Run it**
```bash
npm run dev
```

You should see: `MongoDB connected` and `Server listening on port 3000`

6. **Test it** (PowerShell)
```powershell
# Create an org
Invoke-RestMethod -Uri "http://localhost:3000/org/create" -Method POST -ContentType "application/json" -Body '{"organization_name": "Test Org", "email": "test@test.com", "password": "pass123"}'

# Login
$response = Invoke-RestMethod -Uri "http://localhost:3000/admin/login" -Method POST -ContentType "application/json" -Body '{"email": "test@test.com", "password": "pass123"}'
$token = $response.data.token

# Get org info
Invoke-RestMethod -Uri "http://localhost:3000/org/get?organization_name=Test Org"
```

That's it. Works on Windows/Mac/Linux.

---

## What It Does

- **POST /org/create** - Makes a new org + spins up a MongoDB collection for it
- **POST /admin/login** - Login with email/password, get a JWT token back
- **GET /org/get** - Fetch org info (no auth needed)
- **PUT /org/update** - Rename org and its collection (needs token)
- **DELETE /org/delete** - Delete org and drop its collection (needs token)

Each org is completely isolated. Different collections = no data leaks.

---

## Tech

- Node.js + Express
- MongoDB (Mongoose + Native Driver)
- JWT auth with bcrypt passwords

---

## Why Collection-per-Tenant?

Every org gets its own collection (like `org_acme_inc`). 

**Good:**
- Perfect data isolation
- Delete = just drop the collection (GDPR easy mode)
- Each org can have custom indexes

**Bad:**
- MongoDB starts struggling around 10k collections
- If you need 100k+ orgs, use a shared collection with `tenant_id` instead

I picked this because it's simpler and safer for mid-scale apps (< 5k orgs). For massive scale, you'd shard a single collection.

---

## Files

```
server.js              - Express app
config/db.js           - MongoDB connections
models/Organization.js - Mongoose schema
services/dbService.js  - Collection create/drop/rename
middleware/auth.js     - JWT verification
controllers/           - Business logic
routes/                - API endpoints
```

---

Built by [@yogesh567894](https://github.com/yogesh567894) for a backend assessment.
