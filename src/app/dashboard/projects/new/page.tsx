'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    url: '',
    description: '',
    targetCountries: ['US'],
    targetLanguages: ['en'],
    competitors: [] as string[],
  });
  const [competitorInput, setCompetitorInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create project');
      }

      const project = await response.json();
      router.push(`/dashboard/projects/${project.id}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addCompetitor = () => {
    if (competitorInput && !formData.competitors.includes(competitorInput)) {
      setFormData(prev => ({
        ...prev,
        competitors: [...prev.competitors, competitorInput],
      }));
      setCompetitorInput('');
    }
  };

  const removeCompetitor = (competitor: string) => {
    setFormData(prev => ({
      ...prev,
      competitors: prev.competitors.filter(c => c !== competitor),
    }));
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Create New Project</h1>
          <p className="text-muted-foreground">
            Set up a new SEO campaign to track keywords, backlinks, and performance
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>Basic information about your project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Project Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="My Website"
                  required
                />
              </div>

              <div>
                <label htmlFor="domain" className="block text-sm font-medium mb-2">
                  Domain *
                </label>
                <input
                  id="domain"
                  type="text"
                  value={formData.domain}
                  onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="example.com"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the domain without http:// or www
                </p>
              </div>

              <div>
                <label htmlFor="url" className="block text-sm font-medium mb-2">
                  Full URL *
                </label>
                <input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="https://example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Brief description of this project"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Target Settings</CardTitle>
              <CardDescription>Configure your target audience and markets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="targetCountries" className="block text-sm font-medium mb-2">
                  Target Countries
                </label>
                <select
                  id="targetCountries"
                  multiple
                  value={formData.targetCountries}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData(prev => ({ ...prev, targetCountries: selected }));
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="ES">Spain</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Hold Ctrl/Cmd to select multiple countries
                </p>
              </div>

              <div>
                <label htmlFor="targetLanguages" className="block text-sm font-medium mb-2">
                  Target Languages
                </label>
                <select
                  id="targetLanguages"
                  multiple
                  value={formData.targetLanguages}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData(prev => ({ ...prev, targetLanguages: selected }));
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Competitors</CardTitle>
              <CardDescription>Add competitor domains to track and compare</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetitor())}
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="competitor.com"
                />
                <Button type="button" onClick={addCompetitor} variant="outline">
                  Add
                </Button>
              </div>

              {formData.competitors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.competitors.map((competitor, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full"
                    >
                      <span className="text-sm">{competitor}</span>
                      <button
                        type="button"
                        onClick={() => removeCompetitor(competitor)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
