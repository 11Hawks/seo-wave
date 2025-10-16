'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Search,
} from 'lucide-react';

export default function BacklinksPage() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const stats = [
    {
      title: 'Total Backlinks',
      value: '3,482',
      change: '+87',
      trend: 'up',
    },
    {
      title: 'Referring Domains',
      value: '1,247',
      change: '+23',
      trend: 'up',
    },
    {
      title: 'Dofollow Links',
      value: '2,891',
      change: '+65',
      trend: 'up',
    },
    {
      title: 'Lost This Month',
      value: '42',
      change: '-12',
      trend: 'down',
    },
  ];

  const backlinks = [
    {
      id: '1',
      sourceUrl: 'https://techblog.example.com/best-seo-tools',
      targetUrl: 'https://example.com',
      anchorText: 'SEO analytics platform',
      isDoFollow: true,
      status: 'ACTIVE',
      domainRating: 72,
      urlRating: 58,
      traffic: 2450,
      firstSeenAt: '2023-11-15',
      lastSeenAt: '2024-01-20',
    },
    {
      id: '2',
      sourceUrl: 'https://marketing-news.com/tools-review',
      targetUrl: 'https://example.com',
      anchorText: 'keyword tracking tool',
      isDoFollow: true,
      status: 'ACTIVE',
      domainRating: 65,
      urlRating: 42,
      traffic: 1820,
      firstSeenAt: '2023-10-22',
      lastSeenAt: '2024-01-19',
    },
    {
      id: '3',
      sourceUrl: 'https://forum.marketers.com/thread/12345',
      targetUrl: 'https://example.com',
      anchorText: 'click here',
      isDoFollow: false,
      status: 'ACTIVE',
      domainRating: 48,
      urlRating: 25,
      traffic: 890,
      firstSeenAt: '2023-12-01',
      lastSeenAt: '2024-01-18',
    },
    {
      id: '4',
      sourceUrl: 'https://oldsite.example.net/resources',
      targetUrl: 'https://example.com',
      anchorText: 'SEO platform',
      isDoFollow: true,
      status: 'LOST',
      domainRating: 55,
      urlRating: 38,
      traffic: 650,
      firstSeenAt: '2023-09-10',
      lastSeenAt: '2023-12-28',
    },
    {
      id: '5',
      sourceUrl: 'https://spammy-directory.com/listings',
      targetUrl: 'https://example.com',
      anchorText: 'example',
      isDoFollow: true,
      status: 'ACTIVE',
      domainRating: 12,
      urlRating: 8,
      traffic: 50,
      firstSeenAt: '2024-01-05',
      lastSeenAt: '2024-01-20',
    },
  ];

  const filteredBacklinks = backlinks.filter(backlink => {
    const matchesStatus = filterStatus === 'all' || backlink.status === filterStatus.toUpperCase();
    const matchesSearch =
      backlink.sourceUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      backlink.anchorText.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>;
      case 'LOST':
        return <Badge variant="destructive">Lost</Badge>;
      case 'BROKEN':
        return <Badge variant="destructive">Broken</Badge>;
      case 'REDIRECTED':
        return <Badge variant="secondary">Redirected</Badge>;
      case 'NOFOLLOW':
        return <Badge variant="secondary">Nofollow</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getQualityIndicator = (domainRating: number) => {
    if (domainRating >= 70) return { color: 'text-green-600', label: 'High Quality', icon: CheckCircle };
    if (domainRating >= 40) return { color: 'text-blue-600', label: 'Good Quality', icon: CheckCircle };
    if (domainRating >= 20) return { color: 'text-yellow-600', label: 'Low Quality', icon: AlertTriangle };
    return { color: 'text-red-600', label: 'Spam Risk', icon: AlertTriangle };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Backlink Analysis</h1>
          <p className="text-muted-foreground">
            Monitor your backlink profile and identify high-quality link opportunities
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{stat.title}</span>
                  <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Backlinks</CardTitle>
                <CardDescription>All backlinks pointing to your site</CardDescription>
              </div>
              <Button>Analyze New Backlinks</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search backlinks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2">
                {['all', 'active', 'lost', 'broken'].map((status) => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus(status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredBacklinks.map((backlink) => {
                const quality = getQualityIndicator(backlink.domainRating);
                const QualityIcon = quality.icon;

                return (
                  <div key={backlink.id} className="p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <a
                            href={backlink.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline flex items-center"
                          >
                            {new URL(backlink.sourceUrl).hostname}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                          {getStatusBadge(backlink.status)}
                          {backlink.isDoFollow ? (
                            <Badge variant="success" className="text-xs">Dofollow</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Nofollow</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Anchor: <span className="font-medium text-foreground">{backlink.anchorText}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {backlink.sourceUrl}
                        </p>
                      </div>
                      <div className={`flex items-center space-x-1 ${quality.color}`}>
                        <QualityIcon className="h-4 w-4" />
                        <span className="text-xs font-medium">{quality.label}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">DR: </span>
                        <span className="font-medium">{backlink.domainRating}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">UR: </span>
                        <span className="font-medium">{backlink.urlRating}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Traffic: </span>
                        <span className="font-medium">{backlink.traffic.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">First seen: </span>
                        <span className="font-medium">
                          {new Date(backlink.firstSeenAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last checked: </span>
                        <span className="font-medium">
                          {new Date(backlink.lastSeenAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredBacklinks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No backlinks found matching your filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
