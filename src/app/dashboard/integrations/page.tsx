/**
 * Integrations Dashboard Page
 * Manages Google API connections and data synchronization
 */

import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { GoogleIntegrations } from '@/components/google/google-integrations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, CheckCircle, Plus, Settings } from 'lucide-react'
import Link from 'next/link'

const prisma = new PrismaClient()

interface IntegrationsPageProps {
  searchParams?: {
    success?: string
    error?: string
    sites?: string
    properties?: string
  }
}

async function getIntegrationsData(userId: string) {
  // Get user's organizations
  const organizations = await prisma.organization.findMany({
    where: {
      OR: [
        { ownerId: userId },
        {
          members: {
            some: {
              userId: userId,
              role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
            },
          },
        },
      ],
    },
    include: {
      projects: {
        select: {
          id: true,
          name: true,
          domain: true,
          gscConnected: true,
          gaConnected: true,
          lastGscSyncAt: true,
          lastGaSyncAt: true,
        },
      },
      googleIntegrations: {
        where: {
          userId: userId,
          isActive: true,
        },
      },
    },
  })

  return { organizations }
}

export default async function IntegrationsPage({ searchParams }: IntegrationsPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const { organizations } = await getIntegrationsData(session.user.id)

  // Handle success/error messages from OAuth callbacks
  const successMessage = searchParams?.success
  const errorMessage = searchParams?.error
  const siteCount = searchParams?.sites
  const propertyCount = searchParams?.properties

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">
            Connect external services to enhance your SEO analytics capabilities
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center space-x-2 pt-4">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div className="flex-1">
              {successMessage === 'gsc_connected' && (
                <p className="text-sm text-green-800">
                  Google Search Console connected successfully! 
                  {siteCount && ` Found ${siteCount} verified sites.`}
                </p>
              )}
              {successMessage === 'ga_connected' && (
                <p className="text-sm text-green-800">
                  Google Analytics connected successfully!
                  {propertyCount && ` Found ${propertyCount} properties.`}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {errorMessage && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center space-x-2 pt-4">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <div className="flex-1">
              <p className="text-sm text-red-800">
                {errorMessage === 'oauth_denied' && 'OAuth authorization was denied. Please try again.'}
                {errorMessage === 'missing_params' && 'Missing required parameters. Please try again.'}
                {errorMessage === 'invalid_state' && 'Invalid OAuth state. Please try again.'}
                {errorMessage === 'invalid_service' && 'Invalid service type. Please try again.'}
                {errorMessage === 'connection_failed' && 'Connection failed. Please check your permissions and try again.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {organizations.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Organizations Found</CardTitle>
              <CardDescription>
                You need to create or join an organization to set up integrations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/organizations/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Organization
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          organizations.map(org => (
            <div key={org.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{org.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {org.projects.length} projects • {org.googleIntegrations.length} Google integrations
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {org.googleIntegrations.some(i => i.service === 'SEARCH_CONSOLE') && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      Search Console
                    </Badge>
                  )}
                  {org.googleIntegrations.some(i => i.service === 'ANALYTICS') && (
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      Analytics
                    </Badge>
                  )}
                </div>
              </div>

              <Suspense 
                fallback={
                  <Card>
                    <CardContent className="flex items-center justify-center h-48">
                      <div className="animate-pulse text-muted-foreground">Loading integrations...</div>
                    </CardContent>
                  </Card>
                }
              >
                <GoogleIntegrations 
                  organizationId={org.id}
                  projects={org.projects}
                />
              </Suspense>

              {org !== organizations[organizations.length - 1] && (
                <Separator className="my-8" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Additional Integration Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Additional Integrations</span>
          </CardTitle>
          <CardDescription>
            More integrations will be available soon to enhance your SEO toolkit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Bing Webmaster Tools</h4>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
              <Badge variant="secondary">Soon</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">SEMrush API</h4>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
              <Badge variant="secondary">Soon</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Ahrefs API</h4>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
              <Badge variant="secondary">Soon</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}