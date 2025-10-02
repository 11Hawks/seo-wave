import React, { useState, useEffect } from 'react'

export interface FilterCriteria {
  difficulty: string[]
  priority: string[]
  positionRange: { min: number | null; max: number | null }
  volumeRange: { min: number | null; max: number | null }
}

interface FilterPanelProps {
  onFilterChange: (filters: FilterCriteria) => void
  collapsible?: boolean
  value?: FilterCriteria // Controlled mode: parent can pass filter values
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  onFilterChange,
  collapsible = false,
  value
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [filters, setFilters] = useState<FilterCriteria>({
    difficulty: [],
    priority: [],
    positionRange: { min: null, max: null },
    volumeRange: { min: null, max: null }
  })

  // Use controlled value if provided, otherwise use internal state
  const effectiveFilters = value !== undefined ? value : filters

  // Notify parent of filter changes (only for uncontrolled mode)
  useEffect(() => {
    if (value === undefined) {
      onFilterChange(filters)
    }
  }, [filters, onFilterChange, value])

  // Toggle difficulty filter
  const toggleDifficulty = (level: string) => {
    const newDifficulty = effectiveFilters.difficulty.includes(level)
      ? effectiveFilters.difficulty.filter(d => d !== level)
      : [...effectiveFilters.difficulty, level]
    const newFilters = { ...effectiveFilters, difficulty: newDifficulty }
    
    if (value !== undefined) {
      // Controlled mode: notify parent immediately
      onFilterChange(newFilters)
    } else {
      // Uncontrolled mode: update internal state
      setFilters(newFilters)
    }
  }

  // Toggle priority filter
  const togglePriority = (level: string) => {
    const newPriority = effectiveFilters.priority.includes(level)
      ? effectiveFilters.priority.filter(p => p !== level)
      : [...effectiveFilters.priority, level]
    const newFilters = { ...effectiveFilters, priority: newPriority }
    
    if (value !== undefined) {
      onFilterChange(newFilters)
    } else {
      setFilters(newFilters)
    }
  }

  // Handle position range
  const handlePositionChange = (type: 'min' | 'max', inputValue: string) => {
    const numValue = inputValue === '' ? null : parseInt(inputValue, 10)
    const newFilters = {
      ...effectiveFilters,
      positionRange: { ...effectiveFilters.positionRange, [type]: numValue }
    }
    
    if (value !== undefined) {
      onFilterChange(newFilters)
    } else {
      setFilters(newFilters)
    }
  }

  // Handle volume range
  const handleVolumeChange = (type: 'min' | 'max', inputValue: string) => {
    const numValue = inputValue === '' ? null : parseInt(inputValue, 10)
    const newFilters = {
      ...effectiveFilters,
      volumeRange: { ...effectiveFilters.volumeRange, [type]: numValue }
    }
    
    if (value !== undefined) {
      onFilterChange(newFilters)
    } else {
      setFilters(newFilters)
    }
  }

  // Reset all filters
  const handleReset = () => {
    const emptyFilters = {
      difficulty: [],
      priority: [],
      positionRange: { min: null, max: null },
      volumeRange: { min: null, max: null }
    }
    
    if (value !== undefined) {
      onFilterChange(emptyFilters)
    } else {
      setFilters(emptyFilters)
    }
  }

  // Count active filters
  const activeFilterCount = 
    effectiveFilters.difficulty.length +
    effectiveFilters.priority.length +
    (effectiveFilters.positionRange.min !== null || effectiveFilters.positionRange.max !== null ? 1 : 0) +
    (effectiveFilters.volumeRange.min !== null || effectiveFilters.volumeRange.max !== null ? 1 : 0)

  return (
    <div data-testid="filter-panel" className="bg-white border rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {activeFilterCount > 0 && (
            <span 
              data-testid="active-filters-count" 
              className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
            >
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            data-testid="reset-filters-button"
            onClick={handleReset}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Reset
          </button>
          {collapsible && (
            <button
              data-testid="toggle-filters-button"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              className="text-gray-600 hover:text-gray-900"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div data-testid="filter-content" className="space-y-4">
          {/* Difficulty Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Difficulty</h4>
            <div className="space-y-2">
              {['EASY', 'MEDIUM', 'HARD'].map(level => (
                <label key={level} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    data-testid={`difficulty-${level.toLowerCase()}`}
                    checked={effectiveFilters.difficulty.includes(level)}
                    onChange={() => toggleDifficulty(level)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-900">{level}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Priority</h4>
            <div className="space-y-2">
              {['low', 'medium', 'high'].map(level => (
                <label key={level} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    data-testid={`priority-${level}`}
                    checked={effectiveFilters.priority.includes(level)}
                    onChange={() => togglePriority(level)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-900 capitalize">{level}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Position Range Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Position Range</h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                data-testid="position-min"
                placeholder="Min"
                value={effectiveFilters.positionRange.min ?? ''}
                onChange={(e) => handlePositionChange('min', e.target.value)}
                className="w-20 px-2 py-1 border rounded text-sm"
                min="1"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                data-testid="position-max"
                placeholder="Max"
                value={effectiveFilters.positionRange.max ?? ''}
                onChange={(e) => handlePositionChange('max', e.target.value)}
                className="w-20 px-2 py-1 border rounded text-sm"
                min="1"
              />
            </div>
          </div>

          {/* Search Volume Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Search Volume</h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                data-testid="volume-min"
                placeholder="Min"
                value={effectiveFilters.volumeRange.min ?? ''}
                onChange={(e) => handleVolumeChange('min', e.target.value)}
                className="w-24 px-2 py-1 border rounded text-sm"
                min="0"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                data-testid="volume-max"
                placeholder="Max"
                value={effectiveFilters.volumeRange.max ?? ''}
                onChange={(e) => handleVolumeChange('max', e.target.value)}
                className="w-24 px-2 py-1 border rounded text-sm"
                min="0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
