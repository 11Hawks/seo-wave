/**
 * Google Integrations Component
 * Manages Google Search Console and Analytics connections
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Search,
  BarChart3,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Calendar,
  Globe,
  Database,
} from 'lucide-react'

interface GoogleIntegrationsProps {
  organizationId: string
  projects: Array<{
    id: string
    name: string
    domain: string
    gscConnected: boolean
    gaConnected: boolean
    lastGscSyncAt: Date | null
    lastGaSyncAt: Date | null
  }>
}

interface IntegrationStatus {
  searchConsole: {
    connected: boolean
    sites: string[]
    lastSyncAt: Date | null
  }
  analytics: {
    connected: boolean
    properties: string[]
    lastSyncAt: Date | null
  }
}

export function GoogleIntegrations({ organizationId, projects }: GoogleIntegrationsProps) {
  const { toast } = useToast()
  const [status, setStatus] = useState<IntegrationStatus>({
    searchConsole: { connected: false, sites: [], lastSyncAt: null },
    analytics: { connected: false, properties: [], lastSyncAt: null },
  })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<{
    searchConsole: boolean
    analytics: boolean
  }>({
    searchConsole: false,
    analytics: false,
  })

  // Load integration status
  useEffect(() => {
    loadIntegrationStatus()
  }, [organizationId])

  const loadIntegrationStatus = async () => {
    try {
      const response = await fetch(`/api/google/connect`, { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        // For now, just set default status since we don't have full integration yet
        setStatus({
          searchConsole: { connected: false, sites: [], lastSyncAt: null },
          analytics: { connected: false, properties: [], lastSyncAt: null },
        })
      }
    } catch (error) {
      console.error('Failed to load integration status:', error)
      toast({
        title: 'Error',
        description: 'Failed to load Google integration status',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (service: 'SEARCH_CONSOLE' | 'ANALYTICS') => {
    try {
      const serviceName = service === 'SEARCH_CONSOLE' ? 'search-console' : 'analytics'
      const response = await fetch(`/api/google/connect?service=${serviceName}&organizationId=${organizationId}`)
      
      if (response.ok) {
        const data = await response.json()
        // Redirect to Google OAuth
        window.location.href = data.authUrl
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to initiate connection')
      }
    } catch (error) {
      console.error(`Failed to connect ${service}:`, error)
      toast({
        title: 'Connection Error',
        description: error instanceof Error ? error.message : 'Failed to connect to Google',
        variant: 'destructive',
      })
    }
  }

  const handleSync = async (
    service: 'SEARCH_CONSOLE' | 'ANALYTICS',
    projectId: string,
    siteUrl?: string,
    propertyId?: string
  ) => {
    if (service === 'SEARCH_CONSOLE') {
      setSyncing(prev => ({ ...prev, searchConsole: true }))
    } else {
      setSyncing(prev => ({ ...prev, analytics: true }))
    }

    try {
      const response = await fetch('/api/google/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          organizationId,
          services: [service],
          siteUrl,
          propertyId,
          days: 30,
        }),
      })

      const data = await response.json()

      if (data.success || data.partial) {
        toast({
          title: 'Sync Completed',
          description: `${service === 'SEARCH_CONSOLE' ? 'Search Console' : 'Analytics'} data synchronized successfully`,
        })
        
        // Reload integration status
        await loadIntegrationStatus()
      } else {
        throw new Error(data.errors?.join(', ') || 'Sync failed')
      }
    } catch (error) {
      console.error(`Failed to sync ${service}:`, error)
      toast({
        title: 'Sync Error',
        description: error instanceof Error ? error.message : 'Failed to sync data',
        variant: 'destructive',
      })
    } finally {
      if (service === 'SEARCH_CONSOLE') {
        setSyncing(prev => ({ ...prev, searchConsole: false }))
      } else {
        setSyncing(prev => ({ ...prev, analytics: false }))
      }
    }
  }

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never'
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading integrations...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Google Integrations</h2>
        <p className="text-muted-foreground">
          Connect your Google Search Console and Analytics accounts to enable real-time SEO data collection.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Google Search Console */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Search Console</CardTitle>
            </div>
            {status.searchConsole.connected ? (
              <Badge variant="success" className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>Connected</span>
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" />
                <span>Not Connected</span>
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Access keyword rankings, click-through rates, and search performance data directly from Google.
            </p>

            {status.searchConsole.connected ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span>Connected Sites:</span>
                  </span>
                  <span className="font-medium">{status.searchConsole.sites.length}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Last Sync:</span>
                  </span>
                  <span className="font-medium">
                    {formatLastSync(status.searchConsole.lastSyncAt)}
                  </span>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Projects</h4>
                  {projects.map(project => (
                    <div key={project.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{project.domain}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSync('SEARCH_CONSOLE', project.id, project.domain)}
                        disabled={syncing.searchConsole}
                        className="ml-2"
                      >
                        {syncing.searchConsole ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Database className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Button 
                onClick={() => handleConnect('SEARCH_CONSOLE')}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Connect Search Console
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Google Analytics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">Analytics</CardTitle>
            </div>
            {status.analytics.connected ? (
              <Badge variant="success" className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>Connected</span>
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" />
                <span>Not Connected</span>
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Get detailed traffic analytics, user behavior insights, and conversion tracking from Google Analytics 4.
            </p>

            {status.analytics.connected ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Connected Properties:</span>
                  </span>
                  <span className="font-medium">{status.analytics.properties.length}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Last Sync:</span>
                  </span>
                  <span className="font-medium">
                    {formatLastSync(status.analytics.lastSyncAt)}
                  </span>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Projects</h4>
                  {projects.map(project => (
                    <div key={project.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{project.domain}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSync('ANALYTICS', project.id, undefined, status.analytics.properties[0])}
                        disabled={syncing.analytics}
                        className="ml-2"
                      >
                        {syncing.analytics ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Database className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Button 
                onClick={() => handleConnect('ANALYTICS')}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Connect Analytics
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Accuracy Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Data Accuracy & Transparency</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Our platform provides real-time data accuracy verification by cross-referencing multiple data sources.
          </p>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Direct Google API integration for maximum accuracy</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Confidence scoring on all data points</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Real-time discrepancy detection and alerts</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Transparent data freshness indicators</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}