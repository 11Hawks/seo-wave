/**
 * Billing Dashboard Component
 * Shows current subscription, usage, and billing management
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  Settings,
  TrendingUp
} from 'lucide-react';

interface UsageMetrics {
  projects: { current: number; limit: number };
  users: { current: number; limit: number };
  keywords: { current: number; limit: number };
}

interface Subscription {
  id: string;
  status: string;
  planName: string;
  planAmount: number;
  planCurrency: string;
  planInterval: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
}

interface BillingDashboardProps {
  hasSubscription: boolean;
  subscription?: Subscription;
  usage?: UsageMetrics;
  onManageBilling: () => void;
  onChangePlan: () => void;
  loading?: boolean;
}

export function BillingDashboard({
  hasSubscription,
  subscription,
  usage,
  onManageBilling,
  onChangePlan,
  loading = false
}: BillingDashboardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'trialing':
        return <Badge variant="info">Free Trial</Badge>;
      case 'past_due':
        return <Badge variant="warning">Past Due</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Canceled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getUsageColor = (current: number, limit: number) => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUsageBarColor = (current: number, limit: number) => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!hasSubscription) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>No Active Subscription</span>
            </CardTitle>
            <CardDescription>
              Choose a plan to get started with advanced SEO analytics features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onChangePlan} className="w-full md:w-auto">
              Choose a Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!subscription) {
    return <div>Loading subscription details...</div>;
  }

  const isTrialing = subscription.status === 'trialing' && subscription.trialEnd;
  const trialDaysLeft = isTrialing 
    ? Math.ceil((new Date(subscription.trialEnd!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6">
      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Current Subscription</span>
                {getStatusBadge(subscription.status)}
              </CardTitle>
              <CardDescription className="mt-1">
                {subscription.planName} - {formatCurrency(subscription.planAmount, subscription.planCurrency)} per {subscription.planInterval}
              </CardDescription>
            </div>
            <div className="text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={onManageBilling}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Manage</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Trial Information */}
          {isTrialing && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Free Trial Active
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Your trial expires on {formatDate(subscription.trialEnd!)}. 
                    {trialDaysLeft > 0 && ` ${trialDaysLeft} days remaining.`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cancellation Warning */}
          {subscription.cancelAtPeriodEnd && (
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Subscription Ending
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Your subscription will end on {formatDate(subscription.currentPeriodEnd)}. 
                    Reactivate to continue using premium features.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={onManageBilling}
                  >
                    Reactivate Subscription
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Billing Period */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Current period:</span>
            </div>
            <span className="font-medium">
              {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={onChangePlan}
              disabled={loading}
              className="flex-1"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Change Plan
            </Button>
            <Button
              variant="outline"
              onClick={onManageBilling}
              disabled={loading}
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Billing Portal
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Overview */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle>Current Usage</CardTitle>
            <CardDescription>
              Track your usage against plan limits to avoid overages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Projects Usage */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Projects</span>
                <span className={`text-sm font-medium ${getUsageColor(usage.projects.current, usage.projects.limit)}`}>
                  {usage.projects.current} / {usage.projects.limit === -1 ? '∞' : usage.projects.limit}
                </span>
              </div>
              {usage.projects.limit !== -1 && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${getUsageBarColor(usage.projects.current, usage.projects.limit)}`}
                    style={{ width: `${Math.min((usage.projects.current / usage.projects.limit) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Users Usage */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Team Members</span>
                <span className={`text-sm font-medium ${getUsageColor(usage.users.current, usage.users.limit)}`}>
                  {usage.users.current} / {usage.users.limit === -1 ? '∞' : usage.users.limit}
                </span>
              </div>
              {usage.users.limit !== -1 && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${getUsageBarColor(usage.users.current, usage.users.limit)}`}
                    style={{ width: `${Math.min((usage.users.current / usage.users.limit) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Keywords Usage */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Tracked Keywords</span>
                <span className={`text-sm font-medium ${getUsageColor(usage.keywords.current, usage.keywords.limit)}`}>
                  {usage.keywords.current.toLocaleString()} / {usage.keywords.limit === -1 ? '∞' : usage.keywords.limit.toLocaleString()}
                </span>
              </div>
              {usage.keywords.limit !== -1 && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${getUsageBarColor(usage.keywords.current, usage.keywords.limit)}`}
                    style={{ width: `${Math.min((usage.keywords.current / usage.keywords.limit) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}