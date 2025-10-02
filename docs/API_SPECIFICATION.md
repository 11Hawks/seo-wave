# API Specification - Keyword Management System

## Overview

RESTful API specification for the Keyword Management System. This document defines the expected API endpoints, request/response formats, and error handling for backend implementation.

**Base URL**: `/api/keywords`  
**Content-Type**: `application/json`  
**Authentication**: Bearer token (to be implemented)

---

## Table of Contents

1. [Endpoints](#endpoints)
2. [Data Models](#data-models)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [Examples](#examples)

---

## Endpoints

### 1. List Keywords

**GET** `/api/keywords`

Fetch all keywords for a specific project.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | string | Yes | Project identifier |
| `limit` | number | No | Max results (default: 100) |
| `offset` | number | No | Pagination offset (default: 0) |
| `sortBy` | string | No | Sort field (position, volume, etc.) |
| `order` | string | No | Sort order (asc, desc) |

#### Request Example
```http
GET /api/keywords?projectId=proj123&limit=50&sortBy=position&order=asc
Authorization: Bearer {token}
```

#### Response 200 OK
```json
{
  "keywords": [
    {
      "id": "kw1",
      "keyword": "seo tools",
      "projectId": "proj123",
      "searchVolume": 5400,
      "difficulty": "MEDIUM",
      "priority": "high",
      "currentPosition": 8,
      "gscPosition": 7,
      "gscClicks": 145,
      "gscImpressions": 2300,
      "gscCtr": 0.063,
      "confidenceScore": 94,
      "tags": ["seo", "tools"],
      "category": "general",
      "positionTrend": "up",
      "history": [
        {
          "date": "2024-01-01",
          "position": 10,
          "clicks": 120,
          "impressions": 2000,
          "ctr": 0.06
        },
        {
          "date": "2024-01-02",
          "position": 9,
          "clicks": 135,
          "impressions": 2150,
          "ctr": 0.0628
        }
      ],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

---

### 2. Get Single Keyword

**GET** `/api/keywords/:id`

Fetch a single keyword by ID.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Keyword identifier |

#### Request Example
```http
GET /api/keywords/kw1
Authorization: Bearer {token}
```

#### Response 200 OK
```json
{
  "keyword": {
    "id": "kw1",
    "keyword": "seo tools",
    "projectId": "proj123",
    "searchVolume": 5400,
    "difficulty": "MEDIUM",
    "priority": "high",
    "currentPosition": 8,
    "history": [...],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

#### Response 404 Not Found
```json
{
  "error": "Keyword not found",
  "code": "KEYWORD_NOT_FOUND",
  "keywordId": "kw1"
}
```

---

### 3. Create Keyword

**POST** `/api/keywords`

Create a new keyword.

#### Request Body

```json
{
  "keyword": "new seo term",
  "projectId": "proj123",
  "searchVolume": 1000,
  "difficulty": "EASY",
  "priority": "medium",
  "tags": ["seo"],
  "category": "general"
}
```

#### Required Fields
- `keyword` (string): The keyword text
- `projectId` (string): Project identifier

#### Optional Fields
- `searchVolume` (number): Monthly search volume
- `difficulty` (string): EASY | MEDIUM | HARD
- `priority` (string): low | medium | high
- `tags` (string[]): Keyword tags
- `category` (string): Keyword category

#### Request Example
```http
POST /api/keywords
Authorization: Bearer {token}
Content-Type: application/json

{
  "keyword": "best seo tools 2024",
  "projectId": "proj123",
  "searchVolume": 2400,
  "difficulty": "MEDIUM",
  "priority": "high"
}
```

#### Response 201 Created
```json
{
  "keyword": {
    "id": "kw-new",
    "keyword": "best seo tools 2024",
    "projectId": "proj123",
    "searchVolume": 2400,
    "difficulty": "MEDIUM",
    "priority": "high",
    "currentPosition": null,
    "gscClicks": 0,
    "gscImpressions": 0,
    "gscCtr": 0,
    "confidenceScore": null,
    "tags": [],
    "positionTrend": null,
    "history": [],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Response 400 Bad Request
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "keyword",
      "message": "Keyword is required"
    }
  ]
}
```

---

### 4. Update Keyword

**PATCH** `/api/keywords/:id`

Update an existing keyword.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Keyword identifier |

#### Request Body

Partial update - only include fields to update:

```json
{
  "searchVolume": 3000,
  "priority": "high",
  "tags": ["seo", "tools", "2024"]
}
```

#### Request Example
```http
PATCH /api/keywords/kw1
Authorization: Bearer {token}
Content-Type: application/json

{
  "priority": "high",
  "searchVolume": 6000
}
```

#### Response 200 OK
```json
{
  "keyword": {
    "id": "kw1",
    "keyword": "seo tools",
    "projectId": "proj123",
    "searchVolume": 6000,
    "priority": "high",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

#### Response 404 Not Found
```json
{
  "error": "Keyword not found",
  "code": "KEYWORD_NOT_FOUND",
  "keywordId": "kw1"
}
```

---

### 5. Delete Keyword

**DELETE** `/api/keywords/:id`

Delete a single keyword.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Keyword identifier |

#### Request Example
```http
DELETE /api/keywords/kw1
Authorization: Bearer {token}
```

#### Response 200 OK
```json
{
  "success": true,
  "keywordId": "kw1"
}
```

#### Response 404 Not Found
```json
{
  "error": "Keyword not found",
  "code": "KEYWORD_NOT_FOUND",
  "keywordId": "kw1"
}
```

---

### 6. Bulk Delete Keywords

**POST** `/api/keywords/bulk-delete`

Delete multiple keywords at once.

#### Request Body

```json
{
  "ids": ["kw1", "kw2", "kw3"]
}
```

#### Request Example
```http
POST /api/keywords/bulk-delete
Authorization: Bearer {token}
Content-Type: application/json

{
  "ids": ["kw1", "kw2", "kw3"]
}
```

#### Response 200 OK
```json
{
  "success": true,
  "count": 3,
  "deletedIds": ["kw1", "kw2", "kw3"]
}
```

#### Response 207 Multi-Status
Partial success if some deletions fail:

```json
{
  "success": false,
  "count": 2,
  "deletedIds": ["kw1", "kw2"],
  "failed": [
    {
      "keywordId": "kw3",
      "error": "Keyword not found"
    }
  ]
}
```

---

### 7. Update Keyword Position

**POST** `/api/keywords/:id/position`

Update keyword position data (typically called by automated tracking).

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Keyword identifier |

#### Request Body

```json
{
  "position": 7,
  "clicks": 150,
  "impressions": 2500,
  "ctr": 0.06,
  "date": "2024-01-15"
}
```

#### Request Example
```http
POST /api/keywords/kw1/position
Authorization: Bearer {token}
Content-Type: application/json

{
  "position": 7,
  "clicks": 150,
  "impressions": 2500,
  "ctr": 0.06
}
```

#### Response 200 OK
```json
{
  "success": true,
  "keyword": {
    "id": "kw1",
    "currentPosition": 7,
    "positionTrend": "up",
    "history": [...]
  }
}
```

---

## Data Models

### Keyword

```typescript
interface Keyword {
  id: string                          // Unique identifier
  keyword: string                     // Keyword text
  projectId: string                   // Project identifier
  searchVolume?: number               // Monthly search volume
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'  // Keyword difficulty
  cpc?: number                        // Cost per click
  competition?: number                // Competition score (0-1)
  currentPosition?: number            // Current SERP position
  gscPosition?: number                // Google Search Console position
  gscClicks?: number                  // GSC clicks
  gscImpressions?: number             // GSC impressions
  gscCtr?: number                     // GSC click-through rate
  confidenceScore?: number            // Tracking confidence (0-100)
  tags?: string[]                     // Keyword tags
  priority?: 'low' | 'medium' | 'high'  // Business priority
  category?: string                   // Keyword category
  positionTrend?: 'up' | 'down' | 'stable'  // Position trend
  history?: HistoricalDataPoint[]     // Historical data
  createdAt: string                   // ISO 8601 timestamp
  updatedAt: string                   // ISO 8601 timestamp
}
```

### HistoricalDataPoint

```typescript
interface HistoricalDataPoint {
  date: string         // ISO 8601 date (YYYY-MM-DD)
  position?: number    // SERP position
  clicks?: number      // Number of clicks
  impressions?: number // Number of impressions
  ctr?: number        // Click-through rate (0-1)
}
```

### FilterCriteria

```typescript
interface FilterCriteria {
  difficulty: string[]  // ['EASY', 'MEDIUM', 'HARD']
  priority: string[]    // ['low', 'medium', 'high']
  positionRange: {
    min: number | null  // Minimum position
    max: number | null  // Maximum position
  }
  volumeRange: {
    min: number | null  // Minimum search volume
    max: number | null  // Maximum search volume
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    // Additional error details
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `KEYWORD_NOT_FOUND` | 404 | Keyword does not exist |
| `PROJECT_NOT_FOUND` | 404 | Project does not exist |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `DUPLICATE_KEYWORD` | 409 | Keyword already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

### Error Examples

#### Validation Error
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "searchVolume",
      "message": "Must be a positive number"
    }
  ]
}
```

#### Not Found
```json
{
  "error": "Keyword not found",
  "code": "KEYWORD_NOT_FOUND",
  "keywordId": "kw-invalid"
}
```

#### Rate Limit
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

---

## Rate Limiting

**Limits:**
- 100 requests per minute per API key
- 1000 requests per hour per API key

**Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705329600
```

**Rate Limit Exceeded:**
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60

{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

---

## Authentication

**Header:**
```http
Authorization: Bearer {access_token}
```

**Unauthorized Response:**
```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

---

## Pagination

**Query Parameters:**
- `limit`: Number of results (max 100, default 50)
- `offset`: Skip N results (default 0)

**Response:**
```json
{
  "keywords": [...],
  "total": 500,
  "limit": 50,
  "offset": 0,
  "hasMore": true
}
```

---

## Filtering & Sorting

**Query Parameters:**
- `sortBy`: Field to sort by (position, volume, createdAt)
- `order`: Sort order (asc, desc)
- `difficulty`: Filter by difficulty (EASY,MEDIUM,HARD)
- `priority`: Filter by priority (low,medium,high)
- `minPosition`: Minimum position
- `maxPosition`: Maximum position
- `minVolume`: Minimum search volume
- `maxVolume`: Maximum search volume

**Example:**
```http
GET /api/keywords?projectId=proj123&difficulty=EASY,MEDIUM&minPosition=1&maxPosition=10&sortBy=volume&order=desc
```

---

## Examples

### Complete Workflow

#### 1. Fetch Keywords
```bash
curl -X GET "https://api.example.com/api/keywords?projectId=proj123" \
  -H "Authorization: Bearer {token}"
```

#### 2. Create Keyword
```bash
curl -X POST "https://api.example.com/api/keywords" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "new keyword",
    "projectId": "proj123",
    "searchVolume": 1000,
    "difficulty": "MEDIUM",
    "priority": "high"
  }'
```

#### 3. Update Keyword
```bash
curl -X PATCH "https://api.example.com/api/keywords/kw1" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "priority": "high",
    "searchVolume": 2000
  }'
```

#### 4. Delete Keywords
```bash
curl -X POST "https://api.example.com/api/keywords/bulk-delete" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["kw1", "kw2"]
  }'
```

---

## Webhooks (Future)

**Coming Soon:**
- Position change notifications
- Keyword ranking alerts
- Bulk operation completion events

---

## Versioning

**Current Version**: v1  
**Base URL**: `/api/v1/keywords`

**Version Header:**
```http
Accept: application/vnd.seo-wave.v1+json
```

---

## Support

- **Documentation**: [KEYWORD_MANAGEMENT_SYSTEM.md](./KEYWORD_MANAGEMENT_SYSTEM.md)
- **Issues**: https://github.com/give26/seo-wave/issues
- **Email**: support@example.com

---

**Last Updated:** January 2024  
**API Version:** 1.0.0
