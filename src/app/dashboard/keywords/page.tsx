'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import KeywordDashboard from '@/components/keywords/keyword-dashboard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Upload } from 'lucide-react';

export default function KeywordsPage() {
  const mockKeywords = [
    {
      id: '1',
      keyword: 'seo analytics platform',
      projectId: '1',
      searchVolume: 2400,
      difficulty: 'MEDIUM' as const,
      cpc: 4.50,
      competition: 0.72,
      currentPosition: 8,
      gscPosition: 7.8,
      gscClicks: 145,
      gscImpressions: 3250,
      gscCtr: 4.46,
      confidenceScore: 96,
      tags: ['product', 'high-priority'],
      priority: 'high' as const,
      category: 'Product Keywords',
      positionTrend: 'up' as const,
      history: [
        { date: '2024-01-01', position: 12 },
        { date: '2024-01-02', position: 10 },
        { date: '2024-01-03', position: 8 },
      ],
    },
    {
      id: '2',
      keyword: 'keyword rank tracker',
      projectId: '1',
      searchVolume: 1800,
      difficulty: 'EASY' as const,
      cpc: 3.20,
      competition: 0.58,
      currentPosition: 12,
      gscPosition: 11.5,
      confidenceScore: 92,
      tags: ['tool'],
      priority: 'medium' as const,
      positionTrend: 'up' as const,
    },
    {
      id: '3',
      keyword: 'backlink analysis tool',
      projectId: '1',
      searchVolume: 1200,
      difficulty: 'HARD' as const,
      cpc: 5.80,
      competition: 0.85,
      currentPosition: 15,
      confidenceScore: 88,
      priority: 'low' as const,
      positionTrend: 'down' as const,
    },
  ];

  const handleBulkDelete = (ids: string[]) => {
    console.log('Deleting keywords:', ids);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Keywords</h1>
            <p className="text-muted-foreground">
              Track keyword rankings with real-time accuracy verification
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/keywords/import">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/keywords/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Keyword
              </Link>
            </Button>
          </div>
        </div>

        <KeywordDashboard
          projectId="1"
          keywords={mockKeywords}
          isLoading={false}
          onBulkDelete={handleBulkDelete}
        />
      </div>
    </DashboardLayout>
  );
}
