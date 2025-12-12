# Organization Management Service

A Node.js/Express backend implementing a multi-tenant system where each organization gets its own MongoDB collection. Uses Mongoose for the master database and the native MongoDB driver for dynamic collections.

## Tech Stack
- Express.js
- MongoDB (Mongoose for Master DB, Native Driver for dynamic collections)
- bcryptjs
- jsonwebtoken
- dotenv

## Setup

1. Clone or open this workspace.
2. Create a `.env` file based on `.env.example`:

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/org_management_service
JWT_SECRET=change_me
```

3. Install dependencies:

```powershell
npm install
```

4. Start the server:

```powershell
npm run dev
```

Server runs on `http://localhost:3000`.

## API Endpoints

### 1. POST /org/create
Input:
```json
{ "organization_name": "string", "email": "string", "password": "string" }
```
Creates an organization in the master DB, dynamically creates `org_<organization_name>`, and inserts a welcome document.

### 2. POST /admin/login
Input:
```json
{ "email": "string", "password": "string" }
```
Returns a JWT if credentials are valid.

### 3. GET /org/get?organization_name=<name>
Returns org metadata from the master DB.

### 4. PUT /org/update
Auth required (Bearer token).
Input:
```json
{ "organization_name": "string", "new_organization_name": "string", "email": "string", "password": "string" }
```
Renames the dynamic collection and updates the master record.

### 5. DELETE /org/delete
Auth required (Bearer token).
Input:
```json
{ "organization_name": "string" }
```
Drops the dynamic collection and deletes the master record.

## Implementation Notes
- Collection naming: `org_${name.toLowerCase().replace(/\s+/g, '_')}`
- Consistent JSON response: `{ success, data?, error?, message? }`
- Unique indexes on `organization_name` and `admin_email`.
- Console logs: "Collection created", "Collection renamed", "Collection dropped".

## Testing Checklist

### Quick Verification (PowerShell)

The following commands test all 5 endpoints in sequence:

**1. Create Organization**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/org/create" -Method POST -ContentType "application/json" -Body '{"organization_name": "Acme Inc", "email": "admin@acme.com", "password": "Test123!"}'
```
Expected: `success: true`, `collection_name: org_acme_inc`, message "Organization created"

**2. Admin Login**
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3000/admin/login" -Method POST -ContentType "application/json" -Body '{"email": "admin@acme.com", "password": "Test123!"}'
$token = $response.data.token
```
Expected: `success: true`, `token` (JWT string), `org_name: Acme Inc`

**3. Get Organization (No Auth Required)**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/org/get?organization_name=Acme Inc" -Method GET
```
Expected: `success: true`, organization metadata without password

**4. Update Organization (Auth Required)**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/org/update" -Method PUT -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -Body '{"organization_name": "Acme Inc", "new_organization_name": "Acme Labs", "email": "admin@acme.com"}'
```
Expected: `success: true`, `org_collection_name: org_acme_labs`, message "Organization updated"

**5. Delete Organization (Auth Required)**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/org/delete" -Method DELETE -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -Body '{"organization_name": "Acme Labs"}'
```
Expected: `success: true`, message "Organization deleted"

**6. Verify Deletion**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/org/get?organization_name=Acme Labs" -Method GET
```
Expected: 404 error (organization not found)

### Verification in MongoDB Atlas
1. Log into MongoDB Atlas
2. Browse Collections → `org_management_service` database
3. After step 1: See `organizations` collection + `org_acme_inc` collection with welcome doc
4. After step 4: `org_acme_inc` renamed to `org_acme_labs`
5. After step 5: `org_acme_labs` collection dropped, org record removed from `organizations`
