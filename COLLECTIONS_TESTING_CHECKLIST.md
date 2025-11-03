# Collections API Testing Checklist

## Overview
This document provides a comprehensive testing plan for the collections.ts migration from raw SQL to Drizzle ORM repositories.

**Migration Status:** 19 SQL queries → Type-safe repository methods
**Files Modified:**
- `packages/registry/src/routes/collections.ts`
- `packages/registry/src/db/repositories/collection-repository.ts`
- `packages/registry/src/db/repositories/collection-package-repository.ts`
- `packages/registry/src/db/repositories/collection-install-repository.ts` (new)
- `packages/registry/src/db/repositories/collection-star-repository.ts` (new)

---

## 🧪 Testing Strategy

### Pre-Migration Checklist
- [ ] Document current API behavior with example requests/responses
- [ ] Ensure development database has seed data for collections
- [ ] Verify all collection routes are accessible before migration

---

## 📋 Endpoint Testing

### 1. **GET /api/v1/collections** - List/Search Collections

**Purpose:** Search and filter collections with pagination

#### Test Cases:

##### 1.1 Basic Listing
- [ ] **Test:** GET `/api/v1/collections`
- [ ] **Expected:** Returns paginated list of all collections
- [ ] **Verify:**
  - Response contains `collections`, `total`, `page`, `perPage`, `hasMore`
  - Each collection has `id`, `scope`, `name_slug`, `name`, `description`, `author` (username), `official`, `verified`, `category`, `tags`, `framework`, `downloads`, `stars`, `icon`, `created_at`, `updated_at`, `package_count`
  - Default limit is 20
  - Collections ordered by downloads DESC by default

##### 1.2 Filtering by Category
- [ ] **Test:** GET `/api/v1/collections?category=productivity`
- [ ] **Expected:** Returns only collections with category='productivity'
- [ ] **Verify:** All returned collections have matching category

##### 1.3 Filtering by Tag
- [ ] **Test:** GET `/api/v1/collections?tag=react`
- [ ] **Expected:** Returns collections containing 'react' in tags array
- [ ] **Verify:** All returned collections have 'react' in their tags

##### 1.4 Filtering by Framework
- [ ] **Test:** GET `/api/v1/collections?framework=cursor`
- [ ] **Expected:** Returns only Cursor framework collections
- [ ] **Verify:** All returned collections have framework='cursor'

##### 1.5 Filtering by Official Status
- [ ] **Test:** GET `/api/v1/collections?official=true`
- [ ] **Expected:** Returns only official collections
- [ ] **Verify:** All returned collections have official=true

##### 1.6 Filtering by Verified Status
- [ ] **Test:** GET `/api/v1/collections?verified=true`
- [ ] **Expected:** Returns only verified collections
- [ ] **Verify:** All returned collections have verified=true

##### 1.7 Filtering by Scope
- [ ] **Test:** GET `/api/v1/collections?scope=collection`
- [ ] **Expected:** Returns only official scope collections
- [ ] **Verify:** All returned collections have scope='collection'

##### 1.8 Full-Text Search by Name
- [ ] **Test:** GET `/api/v1/collections?query=startup`
- [ ] **Expected:** Returns collections with 'startup' in name, description, name_slug, or tags
- [ ] **Verify:** Search is case-insensitive and matches partial terms

##### 1.9 Full-Text Search - PostgreSQL tsquery
- [ ] **Test:** GET `/api/v1/collections?query=react+typescript`
- [ ] **Expected:** Returns collections matching both 'react' AND 'typescript'
- [ ] **Verify:** Full-text search uses PostgreSQL websearch_to_tsquery

##### 1.10 Filtering by Author Username
- [ ] **Test:** GET `/api/v1/collections?author=testuser`
- [ ] **Expected:** Returns collections created by user 'testuser'
- [ ] **Verify:** All returned collections have author='testuser'

##### 1.11 Combined Filters
- [ ] **Test:** GET `/api/v1/collections?category=productivity&framework=cursor&official=true`
- [ ] **Expected:** Returns collections matching ALL filters
- [ ] **Verify:** Results satisfy all three conditions

##### 1.12 Sorting by Downloads (Default)
- [ ] **Test:** GET `/api/v1/collections?sortBy=downloads&sortOrder=desc`
- [ ] **Expected:** Collections sorted by download count descending
- [ ] **Verify:** First collection has highest downloads

##### 1.13 Sorting by Stars
- [ ] **Test:** GET `/api/v1/collections?sortBy=stars&sortOrder=desc`
- [ ] **Expected:** Collections sorted by star count descending
- [ ] **Verify:** First collection has highest stars

##### 1.14 Sorting by Created Date
- [ ] **Test:** GET `/api/v1/collections?sortBy=created&sortOrder=desc`
- [ ] **Expected:** Collections sorted by creation date, newest first
- [ ] **Verify:** First collection is most recently created

##### 1.15 Sorting by Updated Date
- [ ] **Test:** GET `/api/v1/collections?sortBy=updated&sortOrder=asc`
- [ ] **Expected:** Collections sorted by update date, oldest first
- [ ] **Verify:** First collection has oldest updated_at

##### 1.16 Sorting by Name
- [ ] **Test:** GET `/api/v1/collections?sortBy=name&sortOrder=asc`
- [ ] **Expected:** Collections sorted alphabetically by name
- [ ] **Verify:** Results in alphabetical order

##### 1.17 Pagination - First Page
- [ ] **Test:** GET `/api/v1/collections?limit=5&offset=0`
- [ ] **Expected:** Returns first 5 collections
- [ ] **Verify:**
  - `collections` array has 5 items
  - `page` = 1
  - `hasMore` = true if total > 5

##### 1.18 Pagination - Second Page
- [ ] **Test:** GET `/api/v1/collections?limit=5&offset=5`
- [ ] **Expected:** Returns next 5 collections
- [ ] **Verify:**
  - Different collections than page 1
  - `page` = 2

##### 1.19 Pagination - Last Page
- [ ] **Test:** GET collections with offset near total count
- [ ] **Expected:** `hasMore` = false on last page
- [ ] **Verify:** Pagination flags correct

##### 1.20 Empty Results
- [ ] **Test:** GET `/api/v1/collections?category=nonexistent`
- [ ] **Expected:** Empty array with total=0
- [ ] **Verify:** No error, proper empty state

##### 1.21 Package Count Accuracy
- [ ] **Test:** GET `/api/v1/collections` and verify a collection's package_count
- [ ] **Expected:** package_count matches actual packages in collection
- [ ] **Verify:** Run GET `/api/v1/collections/:scope/:slug` and count packages

---

### 2. **GET /api/v1/collections/:scope/:slug** - Get Collection Details

**Purpose:** Retrieve detailed information about a specific collection

#### Test Cases:

##### 2.1 Get Collection by Scope and Slug
- [ ] **Test:** GET `/api/v1/collections/collection/startup-mvp`
- [ ] **Expected:** Returns full collection details with packages
- [ ] **Verify:**
  - Collection object with all metadata
  - `author` field contains username (not just ID)
  - `packages` array with ordered packages
  - Each package has: `id`, `package_id`, `name`, `version`, `description`, `format`, `subtype`, `required`, `reason`, `install_order`

##### 2.2 Get Collection - Latest Version (No Version Specified)
- [ ] **Test:** GET `/api/v1/collections/collection/test-collection`
- [ ] **Expected:** Returns most recent version
- [ ] **Verify:** Returns collection with highest version number or most recent created_at

##### 2.3 Get Collection - Specific Version
- [ ] **Test:** GET `/api/v1/collections/testuser/my-collection?version=1.0.0`
- [ ] **Expected:** Returns specific version 1.0.0
- [ ] **Verify:** Returned collection.version === '1.0.0'

##### 2.4 Get Collection - User Scope
- [ ] **Test:** GET `/api/v1/collections/testuser/my-collection`
- [ ] **Expected:** Returns user-scoped collection
- [ ] **Verify:** scope === 'testuser'

##### 2.5 Get Collection - Not Found
- [ ] **Test:** GET `/api/v1/collections/nonexistent/fake-collection`
- [ ] **Expected:** 404 Not Found
- [ ] **Verify:** Proper error message

##### 2.6 Package Ordering
- [ ] **Test:** GET collection and check packages array
- [ ] **Expected:** Packages ordered by install_order ASC
- [ ] **Verify:** First package has lowest install_order

##### 2.7 Package Version Information
- [ ] **Test:** GET collection and check package versions
- [ ] **Expected:** Each package shows correct version (or 'latest')
- [ ] **Verify:** packageVersion field matches database

##### 2.8 Required vs Optional Packages
- [ ] **Test:** GET collection with mixed required/optional packages
- [ ] **Expected:** Each package has correct `required` boolean
- [ ] **Verify:** required field accurately reflects database

---

### 3. **POST /api/v1/collections** - Create Collection

**Purpose:** Create a new collection with packages

#### Test Cases:

##### 3.1 Create Basic Collection
- [ ] **Test:** POST `/api/v1/collections` with minimal fields
```json
{
  "scope": "testuser",
  "name": "My Test Collection",
  "name_slug": "my-test-collection",
  "version": "1.0.0",
  "description": "A test collection",
  "packages": [
    {
      "name": "existing-package",
      "version": "latest",
      "required": true,
      "install_order": 0
    }
  ]
}
```
- [ ] **Expected:** 201 Created with collection object
- [ ] **Verify:**
  - Collection created in database
  - All packages added to collection_packages table
  - Returns created collection with generated ID

##### 3.2 Create Collection with All Fields
- [ ] **Test:** POST with full metadata (category, tags, framework, icon, etc.)
- [ ] **Expected:** All fields saved correctly
- [ ] **Verify:** GET collection returns all provided fields

##### 3.3 Create Collection - Official Scope
- [ ] **Test:** POST with scope='collection'
- [ ] **Expected:** Official collection created
- [ ] **Verify:** scope === 'collection', possibly requires admin privileges

##### 3.4 Create Collection - Multiple Packages
- [ ] **Test:** POST with 5+ packages, varying install_order
- [ ] **Expected:** All packages added correctly
- [ ] **Verify:** GET collection shows all packages in correct order

##### 3.5 Create Collection - Duplicate Detection
- [ ] **Test:** POST collection with same scope/name_slug/version as existing
- [ ] **Expected:** 409 Conflict error
- [ ] **Verify:** Error message indicates duplicate

##### 3.6 Create Collection - Invalid Package Name
- [ ] **Test:** POST with nonexistent package name
- [ ] **Expected:** 400 Bad Request
- [ ] **Verify:** Error indicates which package doesn't exist

##### 3.7 Create Collection - Missing Required Fields
- [ ] **Test:** POST without required fields (scope, name, version)
- [ ] **Expected:** 400 Bad Request
- [ ] **Verify:** Validation error messages

##### 3.8 Create Collection - Empty Packages Array
- [ ] **Test:** POST with packages=[]
- [ ] **Expected:** Collection created with no packages
- [ ] **Verify:** GET collection shows empty packages array

##### 3.9 Create Collection - Package with Specific Version
- [ ] **Test:** POST with package version="1.2.3"
- [ ] **Expected:** Specific version linked, not 'latest'
- [ ] **Verify:** collection_packages.package_version === '1.2.3'

##### 3.10 Create Collection - Authentication Required
- [ ] **Test:** POST without authentication token
- [ ] **Expected:** 401 Unauthorized
- [ ] **Verify:** Error message about missing auth

##### 3.11 Create Collection - Scope Authorization
- [ ] **Test:** POST with scope=otheruser by testuser
- [ ] **Expected:** 403 Forbidden (cannot create under other user's scope)
- [ ] **Verify:** Authorization logic working

---

### 4. **PUT /api/v1/collections/:scope/:slug** - Update Collection

**Purpose:** Update existing collection metadata and packages

#### Test Cases:

##### 4.1 Update Collection Metadata
- [ ] **Test:** PUT with updated description, tags, category
- [ ] **Expected:** Metadata updated successfully
- [ ] **Verify:** GET shows updated fields

##### 4.2 Update Collection Packages - Add New
- [ ] **Test:** PUT with additional packages
- [ ] **Expected:** New packages added to collection
- [ ] **Verify:** GET shows all old + new packages

##### 4.3 Update Collection Packages - Remove
- [ ] **Test:** PUT with fewer packages than before
- [ ] **Expected:** Missing packages removed from collection
- [ ] **Verify:** collection_packages table updated correctly

##### 4.4 Update Collection Packages - Reorder
- [ ] **Test:** PUT with same packages but different install_order
- [ ] **Expected:** Order updated
- [ ] **Verify:** GET shows packages in new order

##### 4.5 Update Collection - Not Found
- [ ] **Test:** PUT to nonexistent collection
- [ ] **Expected:** 404 Not Found
- [ ] **Verify:** Error message

##### 4.6 Update Collection - Version Immutability
- [ ] **Test:** PUT trying to change version field
- [ ] **Expected:** Version should not change (or create new version)
- [ ] **Verify:** Version remains same or new collection created

##### 4.7 Update Collection - Authentication
- [ ] **Test:** PUT without auth token
- [ ] **Expected:** 401 Unauthorized
- [ ] **Verify:** Auth required

##### 4.8 Update Collection - Authorization
- [ ] **Test:** PUT to collection owned by different user
- [ ] **Expected:** 403 Forbidden
- [ ] **Verify:** Can only update own collections

---

### 5. **DELETE /api/v1/collections/:scope/:slug** - Delete Collection

**Purpose:** Remove a collection from the system

#### Test Cases:

##### 5.1 Delete Collection
- [ ] **Test:** DELETE existing collection
- [ ] **Expected:** 200 OK or 204 No Content
- [ ] **Verify:**
  - Collection removed from database
  - collection_packages entries removed (cascade)
  - GET collection returns 404

##### 5.2 Delete Collection - Not Found
- [ ] **Test:** DELETE nonexistent collection
- [ ] **Expected:** 404 Not Found
- [ ] **Verify:** Error message

##### 5.3 Delete Collection - Authentication
- [ ] **Test:** DELETE without auth
- [ ] **Expected:** 401 Unauthorized
- [ ] **Verify:** Auth required

##### 5.4 Delete Collection - Authorization
- [ ] **Test:** DELETE other user's collection
- [ ] **Expected:** 403 Forbidden
- [ ] **Verify:** Cannot delete others' collections

##### 5.5 Delete Collection - Cascade Behavior
- [ ] **Test:** DELETE collection, then verify related data
- [ ] **Expected:** collection_packages, collection_installs cascade deleted
- [ ] **Verify:** No orphaned records in join tables

---

### 6. **POST /api/v1/collections/:scope/:slug/install** - Install Collection

**Purpose:** Track collection installations and return package list

#### Test Cases:

##### 6.1 Install Collection - Official Scope Lookup
- [ ] **Test:** POST `/api/v1/collections/collection/startup-mvp/install`
- [ ] **Expected:** Returns collection with package list
- [ ] **Verify:**
  - If scope='collection', searches across all scopes
  - Prioritizes official=true, then verified=true, then downloads DESC
  - Returns most popular match

##### 6.2 Install Collection - Specific Scope
- [ ] **Test:** POST `/api/v1/collections/testuser/my-collection/install`
- [ ] **Expected:** Returns exact scope match
- [ ] **Verify:** Returns collection with scope='testuser'

##### 6.3 Install Collection - With Version
- [ ] **Test:** POST with body `{"version": "1.0.0"}`
- [ ] **Expected:** Returns specific version
- [ ] **Verify:** Returned collection.version === '1.0.0'

##### 6.4 Install Collection - Latest Version
- [ ] **Test:** POST without version in body
- [ ] **Expected:** Returns latest version
- [ ] **Verify:** Returns most recent version

##### 6.5 Install Collection - Tracking
- [ ] **Test:** POST install, then check collection_installs table
- [ ] **Expected:** Install record created
- [ ] **Verify:**
  - collection_installs has new row
  - Collection downloads count incremented
  - Timestamp recorded

##### 6.6 Install Collection - Package List Format
- [ ] **Test:** POST install and check returned packages
- [ ] **Expected:** Packages with install metadata
- [ ] **Verify:**
  - Each package has name, version, required, reason, install_order
  - Ordered by install_order ASC

##### 6.7 Install Collection - Not Found
- [ ] **Test:** POST to nonexistent collection
- [ ] **Expected:** 404 Not Found
- [ ] **Verify:** Error message

##### 6.8 Install Collection - Session Tracking (Optional)
- [ ] **Test:** POST with session_id in body
- [ ] **Expected:** session_id stored in collection_installs
- [ ] **Verify:** Can track installs by session

---

### 7. **POST /api/v1/collections/:scope/:slug/star** - Star/Unstar Collection

**Purpose:** Add or remove stars from collections

#### Test Cases:

##### 7.1 Star Collection - Add Star
- [ ] **Test:** POST with body `{"action": "star"}`
- [ ] **Expected:** Star added, updated star count returned
- [ ] **Verify:**
  - collection_stars table has new record
  - collection.stars count incremented
  - Response includes updated `stars` count

##### 7.2 Star Collection - Remove Star (Unstar)
- [ ] **Test:** POST with body `{"action": "unstar"}`
- [ ] **Expected:** Star removed, updated count returned
- [ ] **Verify:**
  - collection_stars record deleted
  - collection.stars count decremented

##### 7.3 Star Collection - Idempotent Star
- [ ] **Test:** POST star twice with same user_id
- [ ] **Expected:** Second star doesn't add duplicate
- [ ] **Verify:** ON CONFLICT DO NOTHING behavior

##### 7.4 Star Collection - Authentication Required
- [ ] **Test:** POST star without auth token
- [ ] **Expected:** 401 Unauthorized
- [ ] **Verify:** Cannot star without login

##### 7.5 Star Collection - Not Found
- [ ] **Test:** POST star to nonexistent collection
- [ ] **Expected:** 404 Not Found
- [ ] **Verify:** Error message

##### 7.6 Star Collection - Invalid Action
- [ ] **Test:** POST with action="invalid"
- [ ] **Expected:** 400 Bad Request
- [ ] **Verify:** Only 'star' and 'unstar' allowed

---

### 8. **GET /api/v1/collections/featured** - Get Featured Collections

**Purpose:** Retrieve curated list of featured collections

#### Test Cases:

##### 8.1 Get Featured Collections
- [ ] **Test:** GET `/api/v1/collections/featured`
- [ ] **Expected:** Returns featured collections
- [ ] **Verify:**
  - Only official=true AND verified=true collections
  - Includes author username
  - Includes package_count
  - Default limit 20

##### 8.2 Featured Collections - Limit Parameter
- [ ] **Test:** GET `/api/v1/collections/featured?limit=10`
- [ ] **Expected:** Returns 10 collections
- [ ] **Verify:** Response array length = 10

##### 8.3 Featured Collections - Sorting
- [ ] **Test:** GET featured and check order
- [ ] **Expected:** Sorted by popularity (downloads or stars DESC)
- [ ] **Verify:** First collection most popular

##### 8.4 Featured Collections - Empty State
- [ ] **Test:** GET featured when no official/verified collections exist
- [ ] **Expected:** Empty array
- [ ] **Verify:** No error, graceful empty response

---

### 9. **GET /api/v1/collections/:scope/:slug/:version** - Get Specific Version

**Purpose:** Retrieve a specific version of a collection

#### Test Cases:

##### 9.1 Get Specific Version
- [ ] **Test:** GET `/api/v1/collections/testuser/my-collection/1.0.0`
- [ ] **Expected:** Returns version 1.0.0 exactly
- [ ] **Verify:** collection.version === '1.0.0'

##### 9.2 Get Specific Version - With Packages
- [ ] **Test:** GET version and check packages
- [ ] **Expected:** Packages from that specific version
- [ ] **Verify:** Packages reflect state at version creation time

##### 9.3 Get Specific Version - Not Found
- [ ] **Test:** GET nonexistent version
- [ ] **Expected:** 404 Not Found
- [ ] **Verify:** Error indicates version not found

---

## 🔍 Database Integrity Tests

### Schema Validation
- [ ] Verify all foreign keys maintained after migration
- [ ] Check cascade delete behavior for collection deletion
- [ ] Validate composite primary keys in collection_packages
- [ ] Confirm indexes still exist and performant

### Data Consistency
- [ ] Package counts match actual collection_packages entries
- [ ] Star counts match collection_stars table counts
- [ ] Download counts increment correctly
- [ ] Timestamps (created_at, updated_at) auto-populate

### Repository Unit Tests
- [ ] CollectionRepository.search() with all filter combinations
- [ ] CollectionRepository.findBySlug() with/without version
- [ ] CollectionRepository.findBestMatchByNameSlug() priority logic
- [ ] CollectionPackageRepository.getPackagesWithDetails() joins correctly
- [ ] CollectionInstallRepository.trackInstall() creates records
- [ ] CollectionStarRepository.addStar() / removeStar() idempotency

---

## ⚡ Performance Tests

### Query Performance
- [ ] Search with multiple filters completes in <100ms
- [ ] GET collection details with 50+ packages in <200ms
- [ ] Pagination efficient with large result sets (1000+ collections)
- [ ] Full-text search performant with tsquery

### Concurrency
- [ ] Multiple simultaneous collection installs tracked correctly
- [ ] Concurrent stars don't cause race conditions
- [ ] Package count aggregations remain accurate under load

---

## 🔐 Security & Authorization Tests

### Authentication
- [ ] All mutating operations (POST, PUT, DELETE) require auth
- [ ] Read operations (GET) work without auth
- [ ] Invalid tokens rejected with 401

### Authorization
- [ ] Users can only create collections under their own scope
- [ ] Users can only update/delete their own collections
- [ ] Admin users can modify official collections
- [ ] Cannot star own collections (optional business logic)

### Input Validation
- [ ] SQL injection attempts blocked by parameterized queries
- [ ] XSS attempts sanitized in description/readme fields
- [ ] Invalid UUIDs rejected
- [ ] Malformed JSON payloads return 400

---

## 📊 Monitoring & Logging

### Error Handling
- [ ] Database errors logged with context
- [ ] 404s don't log as errors
- [ ] 500s include request ID for debugging
- [ ] Repository errors bubble up correctly

### Metrics
- [ ] Track API response times
- [ ] Monitor repository method call counts
- [ ] Alert on database connection pool exhaustion
- [ ] Track search query performance

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing in CI/CD
- [ ] Database migrations run on staging
- [ ] Staging smoke tests completed
- [ ] Performance benchmarks meet targets

### Deployment
- [ ] Run database migrations on production
- [ ] Deploy new code
- [ ] Monitor error rates
- [ ] Verify API response times normal

### Post-Deployment
- [ ] Run smoke tests on production
- [ ] Verify no increase in error rates
- [ ] Check database query performance
- [ ] Monitor for N+1 query patterns

---

## 📝 Regression Testing

After migration, verify these existing features still work:

### CLI Integration
- [ ] `prpm collection install <name>` works
- [ ] `prpm collection search <query>` works
- [ ] Collection format conversion works

### Web UI Integration
- [ ] Collections browse page loads
- [ ] Collection detail pages render
- [ ] Star/unstar buttons functional
- [ ] Install counts update in real-time

---

## 🐛 Known Issues / Edge Cases

Document any issues discovered during testing:

- [ ] Edge case: Collection with 0 packages
- [ ] Edge case: Collection with duplicate package names (same package, different versions)
- [ ] Edge case: Very long collection names (>255 chars)
- [ ] Edge case: Tags with special characters
- [ ] Edge case: Malformed version strings

---

## ✅ Sign-Off

**Tested By:** _______________
**Date:** _______________
**Migration Status:** ⬜ Passed | ⬜ Failed | ⬜ Needs Revision

**Notes:**
_________________________________________
_________________________________________
