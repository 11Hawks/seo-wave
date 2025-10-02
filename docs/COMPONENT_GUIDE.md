# Component Usage Guide

Complete guide to using all components in the Keyword Management System.

---

## Table of Contents

1. [KeywordDashboard](#keyworddashboard)
2. [FilterPanel](#filterpanel)
3. [PositionHistoryChart](#positionhistorychart)
4. [PerformanceTrendsChart](#performancetrendschart)
5. [KeywordDetailModal](#keyworddetailmodal)
6. [Hooks](#hooks)
7. [Utilities](#utilities)

---

## KeywordDashboard

Main container component for keyword management with integrated search, filter, sort, and pagination.

### Import

```typescript
import KeywordDashboard from '@/components/keywords/keyword-dashboard'
```

### Props

```typescript
interface KeywordDashboardProps {
  projectId: string          // Required: Project identifier
  keywords?: KeywordData[]   // Optional: Keywords array (for controlled mode)
  isLoading?: boolean        // Optional: Loading state
  error?: string            // Optional: Error message
  onBulkDelete?: (ids: string[]) => void  // Optional: Bulk delete handler
}
```

### Basic Usage

```typescript
function App() {
  const keywords = [
    {
      id: 'kw1',
      keyword: 'seo tools',
      projectId: 'proj1',
      searchVolume: 5400,
      difficulty: 'MEDIUM',
      currentPosition: 8
    }
  ]

  return (
    <KeywordDashboard
      projectId="proj1"
      keywords={keywords}
    />
  )
}
```

### With API Integration

```typescript
import { useKeywords } from '@/hooks/use-keywords'

function App({ projectId }) {
  const {
    keywords,
    isLoading,
    error,
    bulkDelete
  } = useKeywords(projectId)

  return (
    <KeywordDashboard
      projectId={projectId}
      keywords={keywords}
      isLoading={isLoading}
      error={error}
      onBulkDelete={bulkDelete}
    />
  )
}
```

### Features

- ✅ Search by keyword text
- ✅ Multi-criteria filtering (difficulty, priority, position, volume)
- ✅ Sort by position or volume
- ✅ Pagination (10/20/50 per page)
- ✅ Bulk selection and delete
- ✅ CSV export
- ✅ Loading/error/empty states

### Customization

```typescript
// Custom page size default
<KeywordDashboard
  projectId="proj1"
  keywords={keywords}
  // Component manages page size internally
/>

// With custom handlers
<KeywordDashboard
  projectId="proj1"
  keywords={keywords}
  onBulkDelete={async (ids) => {
    await customDeleteHandler(ids)
    // Refresh data
  }}
/>
```

---

## FilterPanel

Controlled or uncontrolled filter panel with multi-criteria filtering.

### Import

```typescript
import { FilterPanel, FilterCriteria } from '@/components/keywords/filter-panel'
```

### Props

```typescript
interface FilterPanelProps {
  onFilterChange: (filters: FilterCriteria) => void  // Required: Filter change callback
  value?: FilterCriteria      // Optional: For controlled mode
  collapsible?: boolean       // Optional: Enable collapse (default: false)
}
```

### Uncontrolled Mode

```typescript
function App() {
  const handleFilterChange = (filters: FilterCriteria) => {
    console.log('Active filters:', filters)
    // Apply filters to your data
  }

  return (
    <FilterPanel
      onFilterChange={handleFilterChange}
      collapsible={true}
    />
  )
}
```

### Controlled Mode

```typescript
function App() {
  const [filters, setFilters] = useState<FilterCriteria>({
    difficulty: [],
    priority: [],
    positionRange: { min: null, max: null },
    volumeRange: { min: null, max: null }
  })

  return (
    <FilterPanel
      value={filters}
      onFilterChange={setFilters}
    />
  )
}
```

### FilterCriteria Interface

```typescript
interface FilterCriteria {
  difficulty: string[]  // ['EASY', 'MEDIUM', 'HARD']
  priority: string[]    // ['low', 'medium', 'high']
  positionRange: {
    min: number | null
    max: number | null
  }
  volumeRange: {
    min: number | null
    max: number | null
  }
}
```

### Applying Filters

```typescript
function applyFilters(keywords: Keyword[], filters: FilterCriteria) {
  return keywords.filter(kw => {
    // Difficulty filter
    if (filters.difficulty.length > 0) {
      if (!kw.difficulty || !filters.difficulty.includes(kw.difficulty)) {
        return false
      }
    }

    // Priority filter
    if (filters.priority.length > 0) {
      if (!kw.priority || !filters.priority.includes(kw.priority)) {
        return false
      }
    }

    // Position range
    if (filters.positionRange.min !== null || filters.positionRange.max !== null) {
      if (!kw.currentPosition) return false
      if (filters.positionRange.min && kw.currentPosition < filters.positionRange.min) return false
      if (filters.positionRange.max && kw.currentPosition > filters.positionRange.max) return false
    }

    // Volume range
    if (filters.volumeRange.min !== null || filters.volumeRange.max !== null) {
      if (!kw.searchVolume) return false
      if (filters.volumeRange.min && kw.searchVolume < filters.volumeRange.min) return false
      if (filters.volumeRange.max && kw.searchVolume > filters.volumeRange.max) return false
    }

    return true
  })
}
```

---

## PositionHistoryChart

Dual Y-axis line chart for position and impressions over time.

### Import

```typescript
import { PositionHistoryChart } from '@/components/keywords/position-history-chart'
```

### Props

```typescript
interface PositionHistoryChartProps {
  data: PositionHistoryDataPoint[]  // Required: Chart data
  title?: string         // Optional: Chart title
  width?: number         // Optional: Fixed width
  height?: number        // Optional: Height (default: 300)
  responsive?: boolean   // Optional: Responsive width (default: true)
  showLegend?: boolean  // Optional: Show legend (default: true)
  showGrid?: boolean    // Optional: Show grid (default: true)
}

interface PositionHistoryDataPoint {
  date: string          // ISO date or formatted string
  position?: number     // SERP position (lower is better)
  impressions?: number  // Number of impressions
}
```

### Basic Usage

```typescript
function App() {
  const data = [
    { date: '2024-01-01', position: 10, impressions: 1200 },
    { date: '2024-01-02', position: 9, impressions: 1350 },
    { date: '2024-01-03', position: 8, impressions: 1500 }
  ]

  return (
    <PositionHistoryChart
      data={data}
      height={400}
    />
  )
}
```

### With Title

```typescript
<PositionHistoryChart
  data={historyData}
  title="Position Trend - Last 30 Days"
  height={350}
  showLegend={true}
/>
```

### Custom Styling

```typescript
<div className="bg-white p-6 rounded-lg shadow">
  <PositionHistoryChart
    data={historyData}
    height={300}
    responsive={true}
  />
</div>
```

### Empty State

Component handles empty data gracefully:

```typescript
<PositionHistoryChart
  data={[]}  // Shows "No historical data available"
  height={300}
/>
```

---

## PerformanceTrendsChart

Multi-line chart for clicks, impressions, and CTR with toggleable metrics.

### Import

```typescript
import { PerformanceTrendsChart } from '@/components/keywords/performance-trends-chart'
```

### Props

```typescript
interface PerformanceTrendsChartProps {
  data: PerformanceTrendsDataPoint[]  // Required: Chart data
  title?: string          // Optional: Chart title
  width?: number          // Optional: Fixed width
  height?: number         // Optional: Height (default: 300)
  responsive?: boolean    // Optional: Responsive width (default: true)
  showLegend?: boolean   // Optional: Show legend (default: true)
  showGrid?: boolean     // Optional: Show grid (default: true)
  showClicks?: boolean   // Optional: Show clicks line (default: true)
  showImpressions?: boolean  // Optional: Show impressions line (default: true)
  showCtr?: boolean      // Optional: Show CTR line (default: true)
}

interface PerformanceTrendsDataPoint {
  date: string         // ISO date or formatted string
  clicks?: number      // Number of clicks
  impressions?: number // Number of impressions
  ctr?: number        // Click-through rate (0.0375 for 3.75%)
}
```

### Basic Usage

```typescript
function App() {
  const data = [
    { date: '2024-01-01', clicks: 45, impressions: 1200, ctr: 0.0375 },
    { date: '2024-01-02', clicks: 52, impressions: 1350, ctr: 0.0385 },
    { date: '2024-01-03', clicks: 48, impressions: 1400, ctr: 0.0343 }
  ]

  return (
    <PerformanceTrendsChart
      data={data}
      height={400}
    />
  )
}
```

### Toggle Metrics

```typescript
<PerformanceTrendsChart
  data={trendData}
  showClicks={true}
  showImpressions={true}
  showCtr={false}  // Hide CTR line
  height={350}
/>
```

### With Custom Title

```typescript
<PerformanceTrendsChart
  data={trendData}
  title="Performance Metrics - Last 7 Days"
  height={300}
/>
```

---

## KeywordDetailModal

Modal showing detailed keyword information with charts.

### Import

```typescript
import KeywordDetailModal from '@/components/keywords/keyword-detail-modal'
```

### Props

```typescript
interface KeywordDetailModalProps {
  keyword: KeywordData    // Required: Keyword to display
  isOpen: boolean        // Required: Modal open state
  onClose: () => void   // Required: Close handler
}
```

### Basic Usage

```typescript
function App() {
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleKeywordClick = (keyword: KeywordData) => {
    setSelectedKeyword(keyword)
    setIsModalOpen(true)
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setSelectedKeyword(null)
  }

  return (
    <>
      <KeywordList onKeywordClick={handleKeywordClick} />
      
      {selectedKeyword && (
        <KeywordDetailModal
          keyword={selectedKeyword}
          isOpen={isModalOpen}
          onClose={handleClose}
        />
      )}
    </>
  )
}
```

### Features

- Basic keyword information
- Performance metrics (clicks, impressions, CTR)
- Historical charts (if history data exists)
- Responsive design
- Click outside or ESC to close

---

## Hooks

### useKeywords

Custom React hook for keyword data management with CRUD operations.

#### Import

```typescript
import { useKeywords } from '@/hooks/use-keywords'
```

#### Usage

```typescript
function App({ projectId }) {
  const {
    keywords,        // Keyword[]
    isLoading,       // boolean
    error,           // string | null
    createKeyword,   // (data) => Promise<Keyword>
    updateKeyword,   // (id, data) => Promise<Keyword>
    deleteKeyword,   // (id) => Promise<void>
    bulkDelete,      // (ids) => Promise<void>
    refetch          // () => Promise<void>
  } = useKeywords(projectId)

  if (isLoading) return <Loading />
  if (error) return <Error message={error} />

  return <KeywordList keywords={keywords} />
}
```

#### Create Keyword

```typescript
const { createKeyword } = useKeywords(projectId)

const handleCreate = async () => {
  try {
    const newKeyword = await createKeyword({
      keyword: 'new seo term',
      searchVolume: 1000,
      difficulty: 'MEDIUM',
      priority: 'high'
    })
    console.log('Created:', newKeyword)
  } catch (err) {
    console.error('Create failed:', err)
  }
}
```

#### Update Keyword

```typescript
const { updateKeyword } = useKeywords(projectId)

const handleUpdate = async (id: string) => {
  try {
    const updated = await updateKeyword(id, {
      priority: 'high',
      searchVolume: 2000
    })
    console.log('Updated:', updated)
  } catch (err) {
    console.error('Update failed:', err)
  }
}
```

#### Delete Keywords

```typescript
const { deleteKeyword, bulkDelete } = useKeywords(projectId)

// Single delete
await deleteKeyword('kw1')

// Bulk delete
await bulkDelete(['kw1', 'kw2', 'kw3'])
```

#### Refetch Data

```typescript
const { refetch } = useKeywords(projectId)

const handleRefresh = async () => {
  await refetch()
}
```

---

## Utilities

### exportToCSV

Export keywords to CSV file with RFC 4180 compliance.

#### Import

```typescript
import { exportToCSV } from '@/utils/csv-export'
```

#### Usage

```typescript
const keywords = [
  { id: 'kw1', keyword: 'seo tools', projectId: 'proj1', searchVolume: 5400 },
  { id: 'kw2', keyword: 'keyword, research', projectId: 'proj1', searchVolume: 2100 }
]

// Export with custom filename
exportToCSV(keywords, 'my-keywords')
// Downloads: my-keywords_2024-01-15.csv

// Export with default filename
exportToCSV(keywords)
// Downloads: keywords_2024-01-15.csv
```

#### Features

- Automatic field escaping (commas, quotes, newlines)
- Smart number formatting (2 decimals)
- Percentage conversion (0.075 → "7.5%")
- Timestamped filenames
- Browser download via Blob API

---

## Complete Example

Putting it all together:

```typescript
import { useState } from 'react'
import { useKeywords } from '@/hooks/use-keywords'
import KeywordDashboard from '@/components/keywords/keyword-dashboard'
import KeywordDetailModal from '@/components/keywords/keyword-detail-modal'
import { exportToCSV } from '@/utils/csv-export'

function KeywordManager({ projectId }) {
  const {
    keywords,
    isLoading,
    error,
    createKeyword,
    bulkDelete,
    refetch
  } = useKeywords(projectId)

  const [selectedKeyword, setSelectedKeyword] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleKeywordClick = (keyword) => {
    setSelectedKeyword(keyword)
    setIsModalOpen(true)
  }

  const handleBulkDelete = async (ids) => {
    await bulkDelete(ids)
    await refetch()
  }

  const handleExport = () => {
    exportToCSV(keywords, `keywords_${projectId}`)
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <div>
      <header>
        <h1>Keyword Management</h1>
        <button onClick={handleExport}>Export CSV</button>
        <button onClick={refetch}>Refresh</button>
      </header>

      <KeywordDashboard
        projectId={projectId}
        keywords={keywords}
        onBulkDelete={handleBulkDelete}
      />

      {selectedKeyword && (
        <KeywordDetailModal
          keyword={selectedKeyword}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  )
}

export default KeywordManager
```

---

## Best Practices

### Performance

1. **Memoization**: Use `useMemo` for expensive computations
2. **Pagination**: Limit visible rows for large datasets
3. **Debouncing**: Debounce search input
4. **Lazy Loading**: Load charts only when modal opens

### Error Handling

1. **User-Friendly Messages**: Show clear error messages
2. **Retry Logic**: Implement retry for failed requests
3. **Fallback UI**: Show fallback when data unavailable
4. **Loading States**: Always show loading indicators

### Accessibility

1. **Keyboard Navigation**: Support Tab, Enter, ESC
2. **ARIA Labels**: Add descriptive labels
3. **Focus Management**: Manage focus in modals
4. **Screen Readers**: Test with screen readers

---

## Troubleshooting

**Charts not rendering?**
- Install Recharts: `npm install recharts`
- Check data format matches interface

**Filters not working?**
- Verify FilterCriteria interface
- Check filter logic implementation

**Hook not fetching?**
- Ensure projectId is not null
- Check API endpoint configuration
- Verify network requests in DevTools

---

## Support

- **Full Documentation**: [KEYWORD_MANAGEMENT_SYSTEM.md](./KEYWORD_MANAGEMENT_SYSTEM.md)
- **API Spec**: [API_SPECIFICATION.md](./API_SPECIFICATION.md)
- **Quick Start**: [QUICK_START.md](./QUICK_START.md)

---

**Last Updated:** January 2024
