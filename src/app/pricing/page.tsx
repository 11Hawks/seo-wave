'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PricingPlans } from '@/components/billing/pricing-plans';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
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
        'Real-time data accuracy scoring',
        'CSV export',
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
        'Team collaboration (10 users)',
        'API access',
        'Backlink analysis',
        'Site audits',
        'Competitor tracking',
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
        'White-label solutions',
        'Priority phone support',
      ],
      limits: {
        maxProjects: -1,
        maxUsers: -1,
        maxKeywords: -1,
      },
    },
  ];

  const comparisonFeatures = [
    { category: 'Core Features', features: [
      'Keyword tracking',
      'Rank monitoring',
      'Google Search Console integration',
      'Data accuracy scoring',
      'CSV export',
      'Email support',
    ]},
    { category: 'Advanced Features', features: [
      'Google Analytics integration',
      'Backlink analysis',
      'Site audits',
      'Competitor tracking',
      'White-label reporting',
      'API access',
    ]},
    { category: 'Team & Collaboration', features: [
      'Team members',
      'Role-based permissions',
      'Client management',
      'Shared reports',
    ]},
  ];

  const handleSelectPlan = (planId: string, stripePriceId: string) => {
    setSelectedPlan(planId);
    window.location.href = '/auth/signup';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg"></div>
            <span className="font-bold text-xl">SEO Analytics</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/auth/signin">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Transparent Pricing for Every Team
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          No hidden fees. No surprise renewals. Just honest pricing with 60-day advance notice on any changes.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 pb-16">
        <PricingPlans
          plans={plans}
          currentPlanId={selectedPlan || undefined}
          onSelectPlan={handleSelectPlan}
          showTrialInfo={true}
        />
      </div>

      {/* Comparison Table */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Detailed Feature Comparison</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="text-left p-4 font-semibold">Features</th>
                    <th className="text-center p-4 font-semibold">Starter</th>
                    <th className="text-center p-4 font-semibold">Professional</th>
                    <th className="text-center p-4 font-semibold">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((section) => (
                    <React.Fragment key={section.category}>
                      <tr className="border-b bg-slate-50 dark:bg-slate-800">
                        <td colSpan={4} className="p-4 font-semibold">
                          {section.category}
                        </td>
                      </tr>
                      {section.features.map((feature) => (
                        <tr key={feature} className="border-b">
                          <td className="p-4">{feature}</td>
                          <td className="text-center p-4">
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          </td>
                          <td className="text-center p-4">
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          </td>
                          <td className="text-center p-4">
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Why Choose Us */}
      <div className="bg-white dark:bg-slate-800 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our Platform?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Transparent Billing</h3>
              <p className="text-muted-foreground">
                60-day advance notice on price changes, real-time usage tracking, and no hidden fees
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Data Accuracy</h3>
              <p className="text-muted-foreground">
                Real-time verification with Google APIs and confidence scoring on all metrics
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Unlimited Collaboration</h3>
              <p className="text-muted-foreground">
                No per-user fees on any plan, with role-based permissions and client management
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Start your 14-day free trial today. No credit card required.
        </p>
        <Link href="/auth/signup">
          <Button size="lg" className="text-lg px-8 py-4">
            Start Free Trial
          </Button>
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-slate-800 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 SEO Analytics Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
