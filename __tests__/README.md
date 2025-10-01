# Testing Infrastructure

This directory contains the comprehensive testing setup for the SEO Analytics Platform.

## 🧪 Test Structure

```
__tests__/
├── unit/              # Pure function/logic tests
├── integration/       # API routes and database tests  
├── components/        # Component behavior tests
├── pages/            # Page rendering tests
├── e2e/              # Playwright end-to-end tests
├── fixtures/         # Test data and mocks
├── utils/            # Testing utilities
└── setup.test.ts     # Infrastructure validation tests

src/__tests__/
├── setup.ts          # Global test setup
├── mocks/
│   └── server.ts     # MSW server configuration
└── utils/
    ├── test-utils.tsx      # React testing utilities
    └── custom-matchers.ts  # Domain-specific assertions
```

## 🚀 Available Scripts

- `npm run test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode  
- `npm run test:ui` - Open Vitest UI dashboard
- `npm run test:coverage` - Generate coverage report
- `npm run test:coverage:ui` - Coverage with UI dashboard

## ✨ Features

### 🎯 **Custom Matchers**
Domain-specific assertions for SEO analytics:

```typescript
// Confidence score validation (80-100%)
expect(94).toHaveValidConfidenceScore()

// Keyword data structure validation
expect(keywordData).toBeValidKeywordData()

// API response structure validation
expect(apiResponse).toHaveValidApiResponse()

// Accuracy threshold checking
expect(95).toBeWithinAccuracyThreshold(90)

// ML metrics validation
expect(mlMetrics).toHaveValidMLMetrics()
```

### 🔧 **Test Utilities**
Reusable utilities for testing:

```typescript
import { render, testUtils } from '../src/__tests__/utils/test-utils'

// Render with all providers (Session, QueryClient, etc.)
render(<MyComponent />, { session: mockSession })

// Generate test data
const id = testUtils.generateId()
const email = testUtils.generateEmail()
const keyword = testUtils.generateKeyword()

// Create API responses
const success = testUtils.mockApiSuccess(data)
const error = testUtils.mockApiError('Error message')
```

### 🎭 **Mock Service Worker (MSW)**
API mocking for consistent testing:

- Health check endpoints (`/api/health`)
- ML confidence scoring (`/api/confidence/*`)
- Keywords API (`/api/keywords/*`)
- Google API integration (`/api/google/*`)
- Authentication (`/api/auth/*`)
- Billing (`/api/billing/*`)

### 📊 **Test Fixtures**
Comprehensive mock data:

- **SEO Data**: Keywords, analytics, search console data
- **User Data**: Users, organizations, sessions, subscriptions
- **API Responses**: Success/error responses for all endpoints

## 🎨 **Testing Patterns**

### **Red-Green-Refactor (TDD)**
1. ✍️ Write failing test
2. ✅ Write minimal code to pass
3. ♻️ Refactor while keeping tests green

### **Arrange-Act-Assert**
```typescript
test('should calculate confidence score', () => {
  // Arrange
  const data = { accuracy: 0.94, freshness: 0.95 }
  
  // Act
  const score = calculateConfidence(data)
  
  // Assert
  expect(score).toHaveValidConfidenceScore()
})
```

### **Component Testing**
```typescript
test('should render keyword dashboard', () => {
  // Arrange
  const keywords = mockKeywordData
  
  // Act
  render(<KeywordDashboard keywords={keywords} />)
  
  // Assert
  expect(screen.getByText('seo analytics platform')).toBeInTheDocument()
})
```

## 📈 **Coverage Goals**

- **Global Coverage**: 80% minimum
- **Critical Functions**: 90%+ (ML scoring, data accuracy)
- **API Routes**: 85%+ coverage
- **Components**: 80%+ coverage

## 🔍 **Quality Gates**

Before any feature development, all tests must:
- ✅ Pass with 0 failures
- ✅ Meet coverage thresholds
- ✅ Have no TypeScript errors
- ✅ Pass linting checks

## 🌍 **Environment Configuration**

Test environment automatically sets:
- `PREVIEW_MODE=true`
- `DISABLE_AUTH=true` 
- `SKIP_ENV_VALIDATION=true`
- Mock authentication and database connections

## 🧩 **Integration Points**

The testing infrastructure is integrated with:
- **Vitest** - Fast test runner with excellent DX
- **@testing-library/react** - Component testing utilities
- **MSW** - API mocking
- **jsdom** - Browser environment simulation
- **Next.js** - Framework-specific configurations

## 📝 **Writing Tests**

### **Basic Test Structure**
```typescript
import { describe, it, expect } from 'vitest'
import '../src/__tests__/utils/custom-matchers'

describe('Feature Name', () => {
  describe('specific behavior', () => {
    it('should do something specific', () => {
      // Test implementation
    })
  })
})
```

### **Component Test Structure**
```typescript
import { render, screen } from '../src/__tests__/utils/test-utils'
import MyComponent from '../src/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

### **API Test Structure**
```typescript
import { mockApiResponses } from './fixtures/api-responses'

describe('API Route', () => {
  it('should return success response', async () => {
    const response = await fetch('/api/endpoint')
    const data = await response.json()
    
    expect(data).toHaveValidApiResponse()
  })
})
```

---

## 🎉 **Phase 1 Complete**

The testing infrastructure is now fully operational and ready for TDD development. All tests pass and the foundation is solid for building robust, error-free features.

**Next Steps**: Proceed to Phase 2 - Critical Path Testing