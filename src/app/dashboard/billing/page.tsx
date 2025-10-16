'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PricingPlans } from '@/components/billing/pricing-plans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Download, AlertCircle } from 'lucide-react';

export default function BillingPage() {
  const currentPlan = {
    name: 'Professional',
    amount: 9900,
    interval: 'month',
    nextBillingDate: '2024-02-15',
  };

  const usage = {
    keywords: { used: 342, limit: 1000, percentage: 34.2 },
    projects: { used: 3, limit: 10, percentage: 30 },
    apiCalls: { used: 15420, limit: 50000, percentage: 30.84 },
  };

  const mockPlans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for individuals and small projects',
      amount: 2900,
      currency: 'usd',
      interval: 'month' as const,
      stripePriceId: 'price_starter_monthly',
      features: [
        'Up to 500 tracked keywords',
        '5 projects',
        'Daily rank updates',
        'Google Search Console integration',
        'Basic reporting',
        'Email support',
      ],
      limits: {
        maxProjects: 5,
        maxUsers: 3,
        maxKeywords: 500,
      },
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'For growing agencies and marketing teams',
      amount: 9900,
      currency: 'usd',
      interval: 'month' as const,
      stripePriceId: 'price_pro_monthly',
      features: [
        'Up to 2,000 tracked keywords',
        '20 projects',
        'Hourly rank updates',
        'Google Analytics integration',
        'Advanced reporting & white-label',
        'Priority support',
        'Team collaboration',
        'API access',
      ],
      limits: {
        maxProjects: 20,
        maxUsers: 10,
        maxKeywords: 2000,
      },
      isPopular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large agencies and organizations',
      amount: 29900,
      currency: 'usd',
      interval: 'month' as const,
      stripePriceId: 'price_enterprise_monthly',
      features: [
        'Unlimited tracked keywords',
        'Unlimited projects',
        'Real-time rank updates',
        'All integrations',
        'Custom reporting',
        'Dedicated account manager',
        'Unlimited team members',
        'Advanced API access',
        'Custom integrations',
      ],
      limits: {
        maxProjects: -1,
        maxUsers: -1,
        maxKeywords: -1,
      },
    },
  ];

  const recentInvoices = [
    {
      id: '1',
      date: '2024-01-15',
      amount: 9900,
      status: 'paid',
      invoiceUrl: '#',
    },
    {
      id: '2',
      date: '2023-12-15',
      amount: 9900,
      status: 'paid',
      invoiceUrl: '#',
    },
    {
      id: '3',
      date: '2023-11-15',
      amount: 9900,
      status: 'paid',
      invoiceUrl: '#',
    },
  ];

  const handleSelectPlan = async (planId: string, stripePriceId: string) => {
    console.log('Selecting plan:', planId, stripePriceId);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription, view usage, and download invoices
          </p>
        </div>

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your active subscription details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="text-muted-foreground">
                  ${(currentPlan.amount / 100).toFixed(2)} per {currentPlan.interval}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Next billing date: {new Date(currentPlan.nextBillingDate).toLocaleDateString()}
                </p>
              </div>
              <Button variant="outline">
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Subscription
              </Button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                    60-Day Cancellation Notice
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    If you need to cancel, we require 60 days advance notice as per our transparent billing policy.
                    This ensures you have time to export your data and transition smoothly.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Current Usage</CardTitle>
            <CardDescription>Track your consumption against plan limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Keywords Tracked</span>
                <span className="text-sm text-muted-foreground">
                  {usage.keywords.used} / {usage.keywords.limit}
                </span>
              </div>
              <Progress value={usage.keywords.percentage} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Active Projects</span>
                <span className="text-sm text-muted-foreground">
                  {usage.projects.used} / {usage.projects.limit}
                </span>
              </div>
              <Progress value={usage.projects.percentage} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">API Calls (this month)</span>
                <span className="text-sm text-muted-foreground">
                  {usage.apiCalls.used.toLocaleString()} / {usage.apiCalls.limit.toLocaleString()}
                </span>
              </div>
              <Progress value={usage.apiCalls.percentage} />
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Download past invoices and receipts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium mb-1">
                      Invoice for {new Date(invoice.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(invoice.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-semibold">${(invoice.amount / 100).toFixed(2)}</div>
                      <Badge variant="success" className="text-xs">
                        {invoice.status}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Available Plans */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
          <PricingPlans
            plans={mockPlans}
            currentPlanId="professional"
            onSelectPlan={handleSelectPlan}
            showTrialInfo={false}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
