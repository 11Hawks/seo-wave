# Quick Start Guide - Keyword Management System

## 🚀 Get Started in 5 Minutes

### Prerequisites

```bash
node >= 18.0.0
npm >= 9.0.0
```

---

## Installation

### 1. Clone & Install

```bash
git clone https://github.com/give26/seo-wave.git
cd seo-wave
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## Basic Usage

### Import Dashboard

```typescript
import KeywordDashboard from '@/components/keywords/keyword-dashboard'

function App() {
  return (
    <KeywordDashboard
      projectId="your-project-id"
      keywords={keywordsArray}
    />
  )
}
```

### With API Integration

```typescript
import { useKeywords } from '@/hooks/use-keywords'
import KeywordDashboard from '@/components/keywords/keyword-dashboard'

function App({ projectId }) {
  const { keywords, isLoading, bulkDelete } = useKeywords(projectId)

  if (isLoading) return <div>Loading...</div>

  return (
    <KeywordDashboard
      projectId={projectId}
      keywords={keywords}
      onBulkDelete={bulkDelete}
    />
  )
}
```

---

## Key Features

### 1. Search & Filter

```typescript
// Search automatically included
// Filters: difficulty, priority, position range, volume range
```

**Try it:**
1. Type in search box
2. Open Filters panel
3. Select "EASY" difficulty
4. Set position range 1-10

### 2. Export Data

```typescript
import { exportToCSV } from '@/utils/csv-export'

<button onClick={() => exportToCSV(keywords, 'my-keywords')}>
  Export CSV
</button>
```

**Try it:**
1. Filter your keywords
2. Click "Export CSV" button
3. CSV downloads automatically

### 3. View Charts

```typescript
<KeywordDetailModal
  keyword={selectedKeyword}
  isOpen={true}
  onClose={() => {}}
/>
```

**Try it:**
1. Click any keyword row
2. Modal opens with charts
3. View position history & performance trends

---

## Common Tasks

### Add New Keyword

```typescript
const { createKeyword } = useKeywords(projectId)

await createKeyword({
  keyword: 'new seo term',
  searchVolume: 1000,
  difficulty: 'MEDIUM',
  priority: 'high'
})
```

### Update Keyword

```typescript
const { updateKeyword } = useKeywords(projectId)

await updateKeyword('keyword-id', {
  priority: 'high',
  searchVolume: 2000
})
```

### Delete Keywords

```typescript
const { bulkDelete } = useKeywords(projectId)

// Delete multiple
await bulkDelete(['id1', 'id2', 'id3'])
```

---

## Testing

```bash
# Run all tests
npm test

# Run specific test
npm test -- keyword-dashboard

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

---

## Deployment

```bash
# Build for production
npm run build

# Type check
npm run type-check

# Lint code
npm run lint
```

---

## Troubleshooting

**Charts not showing?**
```bash
npm install recharts
```

**Tests failing?**
```bash
npm test -- --run
```

**Build errors?**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## Next Steps

1. **Read Full Docs**: `docs/KEYWORD_MANAGEMENT_SYSTEM.md`
2. **Check Examples**: `src/components/keywords/`
3. **Run Tests**: `npm test`
4. **Customize**: Update styles, add features

---

## Need Help?

- 📚 [Full Documentation](./KEYWORD_MANAGEMENT_SYSTEM.md)
- 🐛 [GitHub Issues](https://github.com/give26/seo-wave/issues)
- 💬 [Discussions](https://github.com/give26/seo-wave/discussions)

---

**Happy coding! 🎉**
