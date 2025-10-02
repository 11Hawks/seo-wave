import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

export interface PerformanceTrendsDataPoint {
  date: string
  clicks?: number
  impressions?: number
  ctr?: number
}

interface PerformanceTrendsChartProps {
  data: PerformanceTrendsDataPoint[]
  title?: string
  width?: number
  height?: number
  responsive?: boolean
  showLegend?: boolean
  showGrid?: boolean
  showClicks?: boolean
  showImpressions?: boolean
  showCtr?: boolean
}

export const PerformanceTrendsChart: React.FC<PerformanceTrendsChartProps> = ({
  data,
  title = 'Performance Trends',
  width = 600,
  height = 300,
  responsive = true,
  showLegend = true,
  showGrid = true,
  showClicks = true,
  showImpressions = true,
  showCtr = true
}) => {
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div
        data-testid="performance-trends-chart"
        role="img"
        aria-label="Performance trends line chart"
        className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <p data-testid="empty-chart-message" className="text-gray-500">
          No performance data available
        </p>
      </div>
    )
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return dateString
    }
  }

  // Format CTR as percentage
  const formatCtr = (value: number | undefined) => {
    if (value === undefined) return 'N/A'
    return `${(value * 100).toFixed(2)}%`
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="text-sm font-semibold text-gray-900 mb-2">
            {data.date}
          </p>
          {showClicks && data.clicks !== undefined && (
            <p className="text-sm text-blue-600">
              Clicks: <span className="font-semibold">{data.clicks.toLocaleString()}</span>
            </p>
          )}
          {showImpressions && data.impressions !== undefined && (
            <p className="text-sm text-green-600">
              Impressions: <span className="font-semibold">{data.impressions.toLocaleString()}</span>
            </p>
          )}
          {showCtr && data.ctr !== undefined && (
            <p className="text-sm text-purple-600">
              CTR: <span className="font-semibold">{formatCtr(data.ctr)}</span>
            </p>
          )}
        </div>
      )
    }
    return null
  }

  // Render chart
  const ChartContent = () => (
    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
      <XAxis
        dataKey="date"
        tickFormatter={formatDate}
        stroke="#6b7280"
        style={{ fontSize: '12px' }}
      />
      {(showClicks || showImpressions) && (
        <YAxis
          yAxisId="left"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          label={{ value: 'Clicks / Impressions', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
        />
      )}
      {showCtr && (
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#9333ea"
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
          label={{ value: 'CTR', angle: 90, position: 'insideRight', style: { fontSize: '12px' } }}
        />
      )}
      <Tooltip content={<CustomTooltip />} />
      {showLegend && <Legend />}
      
      {showClicks && (
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="clicks"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6 }}
          name="Clicks"
          connectNulls
        />
      )}
      
      {showImpressions && (
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="impressions"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: '#10b981', r: 4 }}
          activeDot={{ r: 6 }}
          name="Impressions"
          connectNulls
        />
      )}
      
      {showCtr && (
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="ctr"
          stroke="#9333ea"
          strokeWidth={2}
          dot={{ fill: '#9333ea', r: 4 }}
          activeDot={{ r: 6 }}
          name="CTR"
          connectNulls
        />
      )}
    </LineChart>
  )

  return (
    <div
      data-testid="performance-trends-chart"
      role="img"
      aria-label="Performance trends line chart"
      className="w-full"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {responsive ? (
        <ResponsiveContainer width="100%" height={height}>
          <ChartContent />
        </ResponsiveContainer>
      ) : (
        <div style={{ width, height }}>
          <ChartContent />
        </div>
      )}
    </div>
  )
}
