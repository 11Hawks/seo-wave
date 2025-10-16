'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  FolderKanban,
  Search,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Plus,
  Grid3x3,
  List,
  CheckCircle,
} from 'lucide-react';

export default function ProjectsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const projects = [
    {
      id: '1',
      name: 'Company Website',
      domain: 'example.com',
      url: 'https://example.com',
      keywords: 342,
      backlinks: 1250,
      avgPosition: 12.4,
      trend: 'up' as const,
      status: 'ACTIVE' as const,
      confidence: 96,
      lastUpdated: '2 hours ago',
    },
    {
      id: '2',
      name: 'Blog Platform',
      domain: 'blog.example.com',
      url: 'https://blog.example.com',
      keywords: 528,
      backlinks: 890,
      avgPosition: 8.2,
      trend: 'up' as const,
      status: 'ACTIVE' as const,
      confidence: 92,
      lastUpdated: '5 hours ago',
    },
    {
      id: '3',
      name: 'E-commerce Store',
      domain: 'shop.example.com',
      url: 'https://shop.example.com',
      keywords: 377,
      backlinks: 2100,
      avgPosition: 15.7,
      trend: 'down' as const,
      status: 'ACTIVE' as const,
      confidence: 88,
      lastUpdated: '1 day ago',
    },
    {
      id: '4',
      name: 'Landing Page',
      domain: 'landing.example.com',
      url: 'https://landing.example.com',
      keywords: 45,
      backlinks: 120,
      avgPosition: 22.1,
      trend: 'up' as const,
      status: 'PAUSED' as const,
      confidence: 78,
      lastUpdated: '3 days ago',
    },
  ];

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Projects</h1>
            <p className="text-muted-foreground">
              Manage your SEO campaigns and track performance
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderKanban className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'No projects found' : 'No projects yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Get started by creating your first project'}
              </p>
              {!searchTerm && (
                <Button asChild>
                  <Link href="/dashboard/projects/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="font-semibold text-lg hover:text-primary mb-1 block"
                      >
                        {project.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">{project.domain}</p>
                    </div>
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-2 mb-4">
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3" />
                      <span>{project.confidence}% confidence</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-2xl font-bold">{project.keywords}</div>
                      <div className="text-xs text-muted-foreground">Keywords</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{project.backlinks}</div>
                      <div className="text-xs text-muted-foreground">Backlinks</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Avg. Position:</span>
                      <span className="font-semibold">{project.avgPosition}</span>
                      {project.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mt-2">
                    Updated {project.lastUpdated}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && filteredProjects.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Project</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Keywords</th>
                      <th className="text-left p-4 font-medium">Backlinks</th>
                      <th className="text-left p-4 font-medium">Avg. Position</th>
                      <th className="text-left p-4 font-medium">Confidence</th>
                      <th className="text-left p-4 font-medium">Updated</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="p-4">
                          <Link
                            href={`/dashboard/projects/${project.id}`}
                            className="hover:text-primary"
                          >
                            <div className="font-medium">{project.name}</div>
                            <div className="text-sm text-muted-foreground">{project.domain}</div>
                          </Link>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                        </td>
                        <td className="p-4 font-medium">{project.keywords}</td>
                        <td className="p-4 font-medium">{project.backlinks}</td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{project.avgPosition}</span>
                            {project.trend === 'up' ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-sm">{project.confidence}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {project.lastUpdated}
                        </td>
                        <td className="p-4 text-right">
                          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
