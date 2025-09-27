/**
 * Pricing Plans Component
 * Displays available subscription plans with transparent pricing
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Check, AlertCircle } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  stripePriceId: string;
  features: string[];
  limits: {
    maxProjects: number;
    maxUsers: number;
    maxKeywords: number;
  };
  isPopular?: boolean;
}

interface PricingPlansProps {
  plans: PricingPlan[];
  currentPlanId?: string;
  onSelectPlan: (planId: string, stripePriceId: string) => void;
  loading?: boolean;
  showTrialInfo?: boolean;
}

export function PricingPlans({ 
  plans, 
  currentPlanId, 
  onSelectPlan, 
  loading = false,
  showTrialInfo = true 
}: PricingPlansProps) {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  
  const filteredPlans = plans.filter(plan => plan.interval === billingInterval);

  return (
    <div className="space-y-8">
      {/* Billing Interval Toggle */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setBillingInterval('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === 'month'
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('year')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === 'year'
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Yearly
            <Badge variant="success" className="ml-2">
              Save 20%
            </Badge>
          </button>
        </div>
      </div>

      {/* Trial Information */}
      {showTrialInfo && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                14-Day Free Trial
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Start with any plan and get 14 days free. No credit card required during trial.
                Cancel anytime with 60-day advance notice for full transparency.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${
              plan.isPopular 
                ? 'border-primary ring-1 ring-primary' 
                : ''
            } ${
              currentPlanId === plan.id
                ? 'border-green-500 ring-1 ring-green-500'
                : ''
            }`}
          >
            {plan.isPopular && (
              <Badge 
                variant="default" 
                className="absolute -top-3 left-1/2 -translate-x-1/2"
              >
                Most Popular
              </Badge>
            )}
            
            {currentPlanId === plan.id && (
              <Badge 
                variant="success" 
                className="absolute -top-3 right-4"
              >
                Current Plan
              </Badge>
            )}

            <CardHeader className="text-center">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription className="text-base">
                {plan.description}
              </CardDescription>
              <div className="pt-4">
                <div className="text-3xl font-bold">
                  {formatCurrency(plan.amount, plan.currency.toUpperCase())}
                </div>
                <div className="text-sm text-muted-foreground">
                  per {plan.interval}
                  {plan.interval === 'year' && (
                    <span className="text-green-600 ml-1">
                      (Save {formatCurrency(
                        (plan.amount * 12) - plan.amount, 
                        plan.currency.toUpperCase()
                      )})
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Plan Limits */}
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">
                    {plan.limits.maxProjects === -1 ? 'Unlimited' : plan.limits.maxProjects}
                  </span>
                  {' '}projects
                </div>
                <div className="text-sm">
                  <span className="font-medium">
                    {plan.limits.maxUsers === -1 ? 'Unlimited' : plan.limits.maxUsers}
                  </span>
                  {' '}team members
                </div>
                <div className="text-sm">
                  <span className="font-medium">
                    {plan.limits.maxKeywords === -1 ? 'Unlimited' : plan.limits.maxKeywords.toLocaleString()}
                  </span>
                  {' '}tracked keywords
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter>
              <Button
                onClick={() => onSelectPlan(plan.id, plan.stripePriceId)}
                disabled={loading || currentPlanId === plan.id}
                className="w-full"
                variant={plan.isPopular ? 'default' : 'outline'}
              >
                {loading && 'Processing...'}
                {!loading && currentPlanId === plan.id && 'Current Plan'}
                {!loading && currentPlanId !== plan.id && 'Choose Plan'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Transparent Billing Promise */}
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">
          Our Transparent Billing Promise
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700 dark:text-green-300">
          <div className="flex items-start space-x-2">
            <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>60-day advance notice before any price changes</span>
          </div>
          <div className="flex items-start space-x-2">
            <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Real-time usage tracking and alerts</span>
          </div>
          <div className="flex items-start space-x-2">
            <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>No hidden fees or surprise charges</span>
          </div>
          <div className="flex items-start space-x-2">
            <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Easy 2-click cancellation anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}