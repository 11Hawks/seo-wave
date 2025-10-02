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

export interface PositionHistoryDataPoint {
  date: string
  position?: number
  impressions?: number
}

interface PositionHistoryChartProps {
  data: PositionHistoryDataPoint[]
  title?: string
  width?: number
  height?: number
  responsive?: boolean
  showLegend?: boolean
  showGrid?: boolean
}

export const PositionHistoryChart: React.FC<PositionHistoryChartProps> = ({
  data,
  title = 'Position History',
  width = 600,
  height = 300,
  responsive = true,
  showLegend = true,
  showGrid = true
}) => {
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div
        data-testid="position-history-chart"
        role="img"
        aria-label="Position history line chart"
        className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <p data-testid="empty-chart-message" className="text-gray-500">
          No position history data available
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

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {data.date}
          </p>
          {data.position !== undefined && (
            <p className="text-sm text-blue-600">
              Position: <span className="font-semibold">#{data.position}</span>
            </p>
          )}
          {data.impressions !== undefined && (
            <p className="text-sm text-gray-600">
              Impressions: <span className="font-semibold">{data.impressions.toLocaleString()}</span>
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
      <YAxis
        yAxisId="left"
        reversed
        domain={[1, 'auto']}
        stroke="#3b82f6"
        style={{ fontSize: '12px' }}
        label={{ value: 'Position', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
      />
      <YAxis
        yAxisId="right"
        orientation="right"
        stroke="#6b7280"
        style={{ fontSize: '12px' }}
        label={{ value: 'Impressions', angle: 90, position: 'insideRight', style: { fontSize: '12px' } }}
      />
      <Tooltip content={<CustomTooltip />} />
      {showLegend && <Legend />}
      <Line
        yAxisId="left"
        type="monotone"
        dataKey="position"
        stroke="#3b82f6"
        strokeWidth={2}
        dot={{ fill: '#3b82f6', r: 4 }}
        activeDot={{ r: 6 }}
        name="Position"
        connectNulls
      />
      <Line
        yAxisId="right"
        type="monotone"
        dataKey="impressions"
        stroke="#10b981"
        strokeWidth={2}
        dot={{ fill: '#10b981', r: 4 }}
        activeDot={{ r: 6 }}
        name="Impressions"
        connectNulls
      />
    </LineChart>
  )

  return (
    <div
      data-testid="position-history-chart"
      role="img"
      aria-label="Position history line chart"
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
