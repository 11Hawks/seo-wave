/**
 * Data Transparency Report Component
 * Detailed reporting on data sources, accuracy, and methodology
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileText,
  Download,
  Calendar,
  Database,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Target,
} from 'lucide-react'

interface TransparencyReportProps {
  projectId: string
  timeframe?: number // days
}

interface ReportData {
  summary: {
    totalDataPoints: number
    averageAccuracy: number
    sourcesUsed: number
    checksPerformed: number
    alertsGenerated: number
  }
  sources: Array<{
    name: string
    type: string
    reliability: number
    dataPoints: number
    lastUpdate: Date
    status: 'active' | 'degraded' | 'offline'
    accuracyScore: number
  }>
  accuracy: {
    daily: Array<{
      date: string
      accuracy: number
      confidence: number
      issues: number
    }>
    byMetric: Array<{
      metric: string
      accuracy: number
      confidence: number
      sources: number
      lastCheck: Date
    }>
  }
  methodology: {
    confidenceWeights: {
      freshness: number
      consistency: number
      reliability: number
      completeness: number
    }
    thresholds: {
      accuracyAlert: number
      confidenceAlert: number
      freshnessHours: number
      varianceTolerance: number
    }
  }
}

export function TransparencyReport({ projectId, timeframe = 30 }: TransparencyReportProps) {
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<ReportData>({
    summary: {
      totalDataPoints: 0,
      averageAccuracy: 0,
      sourcesUsed: 0,
      checksPerformed: 0,
      alertsGenerated: 0,
    },
    sources: [],
    accuracy: {
      daily: [],
      byMetric: [],
    },
    methodology: {
      confidenceWeights: {
        freshness: 30,
        consistency: 35,
        reliability: 25,
        completeness: 10,
      },
      thresholds: {
        accuracyAlert: 70,
        confidenceAlert: 70,
        freshnessHours: 24,
        varianceTolerance: 15,
      },
    },
  })

  useEffect(() => {
    loadReportData()
  }, [projectId, timeframe])

  const loadReportData = async () => {
    try {
      // For demo purposes, we'll use mock data
      // In production, this would fetch from the API
      setTimeout(() => {
        setReportData({
          summary: {
            totalDataPoints: 15420,
            averageAccuracy: 94,
            sourcesUsed: 3,
            checksPerformed: 2850,
            alertsGenerated: 12,
          },
          sources: [
            {
              name: 'Google Search Console',
              type: 'Primary API',
              reliability: 95,
              dataPoints: 8420,
              lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
              status: 'active',
              accuracyScore: 96,
            },
            {
              name: 'Google Analytics 4',
              type: 'Primary API',
              reliability: 95,
              dataPoints: 6200,
              lastUpdate: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
              status: 'active',
              accuracyScore: 94,
            },
            {
              name: 'SerpAPI',
              type: 'Third-party API',
              reliability: 85,
              dataPoints: 800,
              lastUpdate: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
              status: 'active',
              accuracyScore: 88,
            },
          ],
          accuracy: {
            daily: Array.from({ length: 7 }, (_, i) => ({
              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              accuracy: 90 + Math.random() * 10,
              confidence: 85 + Math.random() * 10,
              issues: Math.floor(Math.random() * 3),
            })).reverse(),
            byMetric: [
              {
                metric: 'Organic Clicks',
                accuracy: 96,
                confidence: 94,
                sources: 2,
                lastCheck: new Date(Date.now() - 1 * 60 * 60 * 1000),
              },
              {
                metric: 'Keyword Rankings',
                accuracy: 92,
                confidence: 89,
                sources: 3,
                lastCheck: new Date(Date.now() - 2 * 60 * 60 * 1000),
              },
              {
                metric: 'Page Views',
                accuracy: 98,
                confidence: 96,
                sources: 1,
                lastCheck: new Date(Date.now() - 1 * 60 * 60 * 1000),
              },
              {
                metric: 'Bounce Rate',
                accuracy: 94,
                confidence: 92,
                sources: 1,
                lastCheck: new Date(Date.now() - 3 * 60 * 60 * 1000),
              },
            ],
          },
          methodology: {
            confidenceWeights: {
              freshness: 30,
              consistency: 35,
              reliability: 25,
              completeness: 10,
            },
            thresholds: {
              accuracyAlert: 70,
              confidenceAlert: 70,
              freshnessHours: 24,
              varianceTolerance: 15,
            },
          },
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to load transparency report:', error)
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200'
      case 'degraded': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'offline': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'degraded': return <AlertTriangle className="h-4 w-4" />
      case 'offline': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60)),
      'hour'
    )
  }

  const exportReport = () => {
    // In production, this would generate and download a PDF/Excel report
    console.log('Exporting transparency report...')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Data Transparency Report</h2>
          <p className="text-muted-foreground">
            Complete visibility into data sources, accuracy calculations, and methodology
          </p>
        </div>
        <Button onClick={exportReport} className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Export Report</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Data Points</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.summary.totalDataPoints.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Last {timeframe} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reportData.summary.averageAccuracy}%
            </div>
            <p className="text-xs text-muted-foreground">
              Multi-source validated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sources</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.summary.sourcesUsed}
            </div>
            <p className="text-xs text-muted-foreground">
              Data sources online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Checks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.summary.checksPerformed.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Automated validations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts Generated</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.summary.alertsGenerated}
            </div>
            <p className="text-xs text-muted-foreground">
              Quality notifications
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="sources" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sources">Data Sources</TabsTrigger>
          <TabsTrigger value="accuracy">Accuracy Trends</TabsTrigger>
          <TabsTrigger value="methodology">Methodology</TabsTrigger>
        </TabsList>

        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle>Data Source Status & Reliability</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reliability</TableHead>
                    <TableHead>Data Points</TableHead>
                    <TableHead>Accuracy Score</TableHead>
                    <TableHead>Last Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.sources.map((source, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{source.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{source.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center space-x-2 px-2 py-1 rounded text-xs ${getStatusColor(source.status)}`}>
                          {getStatusIcon(source.status)}
                          <span className="capitalize">{source.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={source.reliability} className="w-16" />
                          <span className="text-sm">{source.reliability}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{source.dataPoints.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={source.accuracyScore >= 90 ? 'success' : 'warning'}>
                          {source.accuracyScore}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(source.lastUpdate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accuracy">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Daily Accuracy Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.accuracy.daily.map((day, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium w-24">
                          {new Date(day.date).toLocaleDateString('en', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                        <Progress value={day.accuracy} className="w-24" />
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium">{Math.round(day.accuracy)}%</span>
                        {day.issues > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {day.issues} issues
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accuracy by Metric</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Sources</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.accuracy.byMetric.map((metric, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{metric.metric}</TableCell>
                        <TableCell>
                          <Badge variant={metric.accuracy >= 90 ? 'success' : 'warning'}>
                            {metric.accuracy}%
                          </Badge>
                        </TableCell>
                        <TableCell>{metric.confidence}%</TableCell>
                        <TableCell>{metric.sources}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="methodology">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Confidence Score Weights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Data Freshness</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={reportData.methodology.confidenceWeights.freshness} className="w-16" />
                      <span className="text-sm">{reportData.methodology.confidenceWeights.freshness}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cross-source Consistency</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={reportData.methodology.confidenceWeights.consistency} className="w-16" />
                      <span className="text-sm">{reportData.methodology.confidenceWeights.consistency}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Source Reliability</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={reportData.methodology.confidenceWeights.reliability} className="w-16" />
                      <span className="text-sm">{reportData.methodology.confidenceWeights.reliability}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Data Completeness</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={reportData.methodology.confidenceWeights.completeness} className="w-16" />
                      <span className="text-sm">{reportData.methodology.confidenceWeights.completeness}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alert Thresholds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Accuracy Alert Threshold:</span>
                    <span className="font-medium">{reportData.methodology.thresholds.accuracyAlert}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Confidence Alert Threshold:</span>
                    <span className="font-medium">{reportData.methodology.thresholds.confidenceAlert}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Data Freshness Threshold:</span>
                    <span className="font-medium">{reportData.methodology.thresholds.freshnessHours} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Variance Tolerance:</span>
                    <span className="font-medium">±{reportData.methodology.thresholds.varianceTolerance}%</span>
                  </div>
                </div>

                <Separator />

                <div className="text-xs text-muted-foreground">
                  <p className="mb-2">
                    <strong>Our Commitment to Transparency:</strong>
                  </p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>All confidence calculations are based on published algorithms</li>
                    <li>Source reliability scores are updated in real-time</li>
                    <li>Thresholds can be customized per project requirements</li>
                    <li>Full audit trail available for all data quality decisions</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}