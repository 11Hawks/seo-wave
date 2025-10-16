'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  FileSearch,
  PlayCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
} from 'lucide-react';

export default function AuditsPage() {
  const [selectedAudit, setSelectedAudit] = useState<string | null>(null);

  const audits = [
    {
      id: '1',
      projectName: 'Company Website',
      projectDomain: 'example.com',
      status: 'COMPLETED',
      overallScore: 87,
      technicalScore: 92,
      contentScore: 85,
      usabilityScore: 83,
      performanceScore: 89,
      criticalIssues: 3,
      warningIssues: 12,
      noticeIssues: 24,
      crawledPages: 342,
      completedAt: '2024-01-20T10:30:00Z',
    },
    {
      id: '2',
      projectName: 'Blog Platform',
      projectDomain: 'blog.example.com',
      status: 'RUNNING',
      overallScore: null,
      technicalScore: null,
      contentScore: null,
      usabilityScore: null,
      performanceScore: null,
      criticalIssues: 0,
      warningIssues: 0,
      noticeIssues: 0,
      crawledPages: 128,
      completedAt: null,
    },
    {
      id: '3',
      projectName: 'E-commerce Store',
      projectDomain: 'shop.example.com',
      status: 'COMPLETED',
      overallScore: 72,
      technicalScore: 68,
      contentScore: 75,
      usabilityScore: 78,
      performanceScore: 70,
      criticalIssues: 8,
      warningIssues: 25,
      noticeIssues: 41,
      crawledPages: 1247,
      completedAt: '2024-01-18T14:22:00Z',
    },
  ];

  const issueCategories = [
    {
      severity: 'critical',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      issues: [
        { title: 'Missing meta descriptions', count: 45, pages: ['/', '/products', '/about'] },
        { title: 'Broken internal links', count: 12, pages: ['/blog/old-post', '/products/discontinued'] },
        { title: 'Duplicate title tags', count: 8, pages: ['/category/shoes', '/category/boots'] },
      ],
    },
    {
      severity: 'warning',
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      issues: [
        { title: 'Images without alt text', count: 87, pages: ['/gallery', '/products/new'] },
        { title: 'Slow page load time', count: 23, pages: ['/checkout', '/cart'] },
        { title: 'Missing H1 tags', count: 15, pages: ['/landing', '/promo'] },
      ],
    },
    {
      severity: 'notice',
      icon: Info,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      issues: [
        { title: 'Low word count', count: 34, pages: ['/faq', '/terms'] },
        { title: 'Redirect chains', count: 9, pages: ['/old-blog', '/legacy-page'] },
        { title: 'External links without rel attribute', count: 18, pages: ['/resources', '/partners'] },
      ],
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'RUNNING':
        return <Badge variant="secondary">Running</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Site Audits</h1>
            <p className="text-muted-foreground">
              Analyze technical SEO issues and get actionable recommendations
            </p>
          </div>
          <Button>
            <PlayCircle className="h-4 w-4 mr-2" />
            Run New Audit
          </Button>
        </div>

        {/* Recent Audits */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Audits</CardTitle>
            <CardDescription>Your site audit history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {audits.map((audit) => (
                <div
                  key={audit.id}
                  className="p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  onClick={() => setSelectedAudit(audit.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold mb-1">{audit.projectName}</h3>
                      <p className="text-sm text-muted-foreground">{audit.projectDomain}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {audit.overallScore && (
                        <div className="text-center">
                          <div className={`text-3xl font-bold ${getScoreColor(audit.overallScore)}`}>
                            {audit.overallScore}
                          </div>
                          <div className="text-xs text-muted-foreground">Score</div>
                        </div>
                      )}
                      {getStatusBadge(audit.status)}
                    </div>
                  </div>

                  {audit.status === 'RUNNING' ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Crawling pages...</span>
                        <span className="font-medium">{audit.crawledPages} pages</span>
                      </div>
                      <Progress value={45} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Technical</div>
                        <div className={`text-lg font-bold ${getScoreColor(audit.technicalScore!)}`}>
                          {audit.technicalScore}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Content</div>
                        <div className={`text-lg font-bold ${getScoreColor(audit.contentScore!)}`}>
                          {audit.contentScore}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Usability</div>
                        <div className={`text-lg font-bold ${getScoreColor(audit.usabilityScore!)}`}>
                          {audit.usabilityScore}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Performance</div>
                        <div className={`text-lg font-bold ${getScoreColor(audit.performanceScore!)}`}>
                          {audit.performanceScore}
                        </div>
                      </div>
                    </div>
                  )}

                  {audit.status === 'COMPLETED' && (
                    <div className="flex items-center space-x-6 mt-3 pt-3 border-t text-sm">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-muted-foreground">{audit.criticalIssues} critical</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-muted-foreground">{audit.warningIssues} warnings</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Info className="h-4 w-4 text-blue-600" />
                        <span className="text-muted-foreground">{audit.noticeIssues} notices</span>
                      </div>
                      <div className="flex items-center space-x-2 ml-auto">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {new Date(audit.completedAt!).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Issue Details */}
        {selectedAudit && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Issues & Recommendations</h2>
            {issueCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.severity}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${category.bgColor}`}>
                        <Icon className={`h-5 w-5 ${category.color}`} />
                      </div>
                      <div>
                        <CardTitle className="capitalize">{category.severity} Issues</CardTitle>
                        <CardDescription>
                          {category.issues.reduce((sum, issue) => sum + issue.count, 0)} total issues
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {category.issues.map((issue, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{issue.title}</h4>
                            <Badge variant="outline">{issue.count} occurrences</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Affected pages: {issue.pages.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {audits.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSearch className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No audits yet</h3>
              <p className="text-muted-foreground mb-4">
                Run your first site audit to identify SEO issues and get recommendations
              </p>
              <Button>
                <PlayCircle className="h-4 w-4 mr-2" />
                Run First Audit
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
