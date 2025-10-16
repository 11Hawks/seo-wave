'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Link2,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  CheckCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    {
      title: 'Total Keywords',
      value: '1,247',
      change: '+12.5%',
      trend: 'up',
      icon: Search,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Avg. Position',
      value: '8.4',
      change: '-2.1',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Total Backlinks',
      value: '3,482',
      change: '+87',
      trend: 'up',
      icon: Link2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      title: 'Data Confidence',
      value: '94.2%',
      change: '+1.2%',
      trend: 'up',
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
    },
  ];

  const recentProjects = [
    {
      id: '1',
      name: 'Company Website',
      domain: 'example.com',
      keywords: 342,
      avgPosition: 12.4,
      trend: 'up',
      confidence: 96,
    },
    {
      id: '2',
      name: 'Blog Platform',
      domain: 'blog.example.com',
      keywords: 528,
      avgPosition: 8.2,
      trend: 'up',
      confidence: 92,
    },
    {
      id: '3',
      name: 'E-commerce Store',
      domain: 'shop.example.com',
      keywords: 377,
      avgPosition: 15.7,
      trend: 'down',
      confidence: 88,
    },
  ];

  const recentAlerts = [
    {
      type: 'ranking',
      message: 'Keyword "seo analytics" moved from position 15 to 8',
      time: '2 hours ago',
      severity: 'success',
    },
    {
      type: 'backlink',
      message: '3 new high-quality backlinks detected',
      time: '5 hours ago',
      severity: 'success',
    },
    {
      type: 'confidence',
      message: 'Data confidence dropped below 85% for 12 keywords',
      time: '1 day ago',
      severity: 'warning',
    },
  ];

  const topKeywords = [
    {
      keyword: 'seo analytics platform',
      position: 3,
      change: 5,
      volume: 2400,
      confidence: 98,
    },
    {
      keyword: 'keyword rank tracker',
      position: 8,
      change: 2,
      volume: 1800,
      confidence: 95,
    },
    {
      keyword: 'backlink analysis tool',
      position: 12,
      change: -3,
      volume: 1200,
      confidence: 92,
    },
    {
      keyword: 'site audit software',
      position: 6,
      change: 1,
      volume: 980,
      confidence: 96,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your SEO campaigns today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <Badge variant={stat.trend === 'up' ? 'success' : 'secondary'}>
                    {stat.change}
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.title}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Projects */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Projects</CardTitle>
                  <CardDescription>Your most active SEO campaigns</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/projects">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/dashboard/projects/${project.id}`}
                    className="block p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold">{project.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {project.domain}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{project.keywords} keywords</span>
                          <span>Avg. pos: {project.avgPosition}</span>
                          <span className="flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>{project.confidence}% confidence</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {project.trend === 'up' ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Important updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAlerts.map((alert, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div
                      className={`mt-1 p-2 rounded-lg ${
                        alert.severity === 'success'
                          ? 'bg-green-100 dark:bg-green-900/20'
                          : 'bg-yellow-100 dark:bg-yellow-900/20'
                      }`}
                    >
                      {alert.severity === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm mb-1">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Keywords */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Performing Keywords</CardTitle>
                <CardDescription>Keywords with the biggest improvements</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/keywords">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View All Keywords
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topKeywords.map((keyword, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium mb-1">{keyword.keyword}</div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Volume: {keyword.volume.toLocaleString()}</span>
                      <span className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>{keyword.confidence}% confidence</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-lg font-bold">#{keyword.position}</div>
                      <div
                        className={`text-sm flex items-center ${
                          keyword.change > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {keyword.change > 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(keyword.change)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
            <Link href="/dashboard/keywords/import">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Import Keywords</h3>
                <p className="text-sm text-muted-foreground">
                  Add keywords from CSV or Google Search Console
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
            <Link href="/dashboard/audits/new">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Run Site Audit</h3>
                <p className="text-sm text-muted-foreground">
                  Analyze technical SEO issues and get recommendations
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
            <Link href="/dashboard/integrations">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Link2 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Connect Integrations</h3>
                <p className="text-sm text-muted-foreground">
                  Link Google Search Console and Analytics
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
