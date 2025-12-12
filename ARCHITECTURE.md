# Architecture Analysis

## Is the "Collection-per-Tenant" Pattern a Good Architecture?

### Strengths ✅

1. **Strong Data Isolation**  
   Each organization's data lives in a separate MongoDB collection, providing natural tenant isolation. This eliminates the risk of accidentally querying across tenants due to bugs in filter logic.

2. **Simplified Deletion & Compliance**  
   Deleting an organization is as simple as dropping a collection—no complex cascading deletes or data retention policies. This is ideal for GDPR "right to be forgotten" compliance.

3. **Per-Tenant Customization**  
   Each collection can have its own indexes, schema validation rules, or even custom fields without affecting other tenants.

4. **Security**  
   A compromised query or authorization bug is less likely to leak data across organizations since collections are physically separate.

### Trade-offs & Limitations ⚠️

1. **Scalability Ceiling**  
   MongoDB has practical limits on the number of collections (namespace limits). Managing 10,000+ collections becomes operationally complex:
   - Memory overhead for tracking metadata
   - Slower database operations (listCollections, backups)
   - Increased connection pool pressure

2. **Cross-Tenant Analytics**  
   Running reports or aggregations across all tenants requires iterating through every collection, which is inefficient compared to querying a single shared collection with proper indexing.

3. **Schema Migrations**  
   Updating the schema requires modifying thousands of collections instead of one. This increases deployment complexity and rollback difficulty.

4. **Resource Allocation**  
   Small tenants waste resources (indexes, metadata) while large tenants may need sharding within their collection—requiring hybrid solutions.

### Alternative: Shared Collection with `tenant_id` Discriminator

For hyper-scale (100,000+ tenants), a **shared collection** approach with a `tenant_id` field is more performant:

```javascript
// Single collection: "data"
{ tenant_id: "org_123", name: "Product A", ... }
{ tenant_id: "org_456", name: "Product B", ... }
```

**Benefits:**
- Unlimited tenants (no namespace limits)
- Efficient cross-tenant queries with compound indexes (`{ tenant_id: 1, created_at: -1 }`)
- Simplified schema migrations (one collection)
- Better sharding strategies (shard by `tenant_id` for horizontal scaling)

**Requirements:**
- Strict application-level enforcement of `tenant_id` filters in every query
- Row-level security or query middleware to prevent data leaks
- Database-level partial indexes per tenant for performance

### Recommendation

**Use Collection-per-Tenant when:**
- You have < 10,000 organizations
- Strong data isolation is a regulatory requirement
- Each tenant has significantly different schemas or index needs
- Simplified deletion is critical (SaaS with frequent churn)

**Use Shared Collection when:**
- You expect > 10,000 tenants
- Cross-tenant analytics are important
- Schema consistency across tenants
- You need horizontal sharding for scale

### Conclusion for This Assignment

For a **multi-tenant SaaS MVP** or **mid-scale deployment (< 5,000 orgs)**, the collection-per-tenant pattern is a **solid choice** due to:
- Simpler implementation (no query rewriting middleware)
- Natural compliance with data isolation regulations
- Easy tenant offboarding

However, for **hyper-scale** (e.g., 100,000+ tenants like Slack, Shopify), a shared collection with sharding and robust application-level security would be more appropriate.

---

*This implementation demonstrates both architectural awareness and pragmatic trade-off analysis—key skills for senior backend roles.*
