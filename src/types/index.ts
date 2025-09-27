/**
 * Central type definitions for the SEO Analytics Platform
 * Provides comprehensive TypeScript types for all entities and API responses
 */

import type { 
  User, 
  Organization, 
  Project, 
  Keyword, 
  Ranking, 
  Backlink, 
  BillingPlan,
  BillingSubscription,
  SiteAudit,
  GoogleSearchConsoleData,
  GoogleAnalyticsData,
  UserRole,
  UserStatus,
  ProjectStatus,
  SubscriptionStatus,
  KeywordDifficulty,
  BacklinkStatus,
  AuditStatus,
  NotificationType,
  OrganizationMemberRole,
} from '@prisma/client';

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
}

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

export interface SafeUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithOrganizations extends SafeUser {
  ownedOrganizations: Organization[];
  organizationMembers: Array<{
    organization: Organization;
    role: OrganizationMemberRole;
    joinedAt: Date;
  }>;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  organizationName?: string;
}

// ============================================================================
// PROJECT & ORGANIZATION TYPES
// ============================================================================

export interface ProjectWithMetrics extends Project {
  _count: {
    keywords: number;
    rankings: number;
    backlinks: number;
    siteAudits: number;
  };
  organization: Organization | null;
  user: SafeUser;
}

export interface CreateProjectData {
  name: string;
  domain: string;
  url: string;
  description?: string;
  organizationId?: string;
  targetCountries?: string[];
  targetLanguages?: string[];
  competitors?: string[];
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  status?: ProjectStatus;
}

export interface OrganizationWithMembers extends Organization {
  members: Array<{
    user: SafeUser;
    role: OrganizationMemberRole;
    joinedAt: Date;
  }>;
  _count: {
    members: number;
    projects: number;
  };
}

// ============================================================================
// SEO DATA TYPES
// ============================================================================

export interface KeywordWithRankings extends Keyword {
  rankings: Ranking[];
  project: Project;
  latestRanking?: Ranking;
  rankingChange?: number;
}

export interface KeywordMetrics {
  totalKeywords: number;
  averagePosition: number;
  keywordsInTopTen: number;
  keywordsInTopThree: number;
  totalSearchVolume: number;
  estimatedTraffic: number;
  positionDistribution: Record<string, number>;
  difficultyDistribution: Record<KeywordDifficulty, number>;
}

export interface BacklinkMetrics {
  totalBacklinks: number;
  doFollowBacklinks: number;
  noFollowBacklinks: number;
  uniqueDomains: number;
  averageDomainRating: number;
  newBacklinks: number;
  lostBacklinks: number;
  brokenBacklinks: number;
}

export interface BacklinkWithMetrics extends Backlink {
  project: Project;
  domain?: string;
  domainMetrics?: {
    rating: number;
    traffic: number;
    backlinks: number;
  };
}

export interface SiteAuditWithIssues extends SiteAudit {
  project: Project;
  issues?: AuditIssue[];
}

export interface AuditIssue {
  id: string;
  type: 'critical' | 'warning' | 'notice';
  category: string;
  title: string;
  description: string;
  recommendation: string;
  affectedUrls: string[];
  impact: 'high' | 'medium' | 'low';
}

// ============================================================================
// ANALYTICS & REPORTING TYPES
// ============================================================================

export interface AnalyticsOverview {
  dateRange: {
    start: Date;
    end: Date;
  };
  metrics: {
    organicTraffic: number;
    organicTrafficChange: number;
    averagePosition: number;
    averagePositionChange: number;
    totalKeywords: number;
    totalKeywordsChange: number;
    totalBacklinks: number;
    totalBacklinksChange: number;
    totalClicks: number;
    totalClicksChange: number;
    totalImpressions: number;
    totalImpressionsChange: number;
    averageCTR: number;
    averageCTRChange: number;
  };
  topKeywords: Array<{
    keyword: string;
    position: number;
    searchVolume: number;
    clicks: number;
    impressions: number;
  }>;
  topPages: Array<{
    url: string;
    clicks: number;
    impressions: number;
    position: number;
    ctr: number;
  }>;
}

export interface CompetitorAnalysis {
  competitor: string;
  domain: string;
  estimatedTraffic: number;
  totalKeywords: number;
  commonKeywords: number;
  averagePosition: number;
  domainRating: number;
  totalBacklinks: number;
  keywordGaps: KeywordGap[];
  backlinkGaps: BacklinkGap[];
}

export interface KeywordGap {
  keyword: string;
  competitorPosition: number;
  ourPosition: number | null;
  searchVolume: number;
  difficulty: KeywordDifficulty;
  opportunity: 'high' | 'medium' | 'low';
}

export interface BacklinkGap {
  sourceUrl: string;
  domainRating: number;
  traffic: number;
  hasBacklink: boolean;
  opportunity: 'high' | 'medium' | 'low';
}

// ============================================================================
// BILLING & SUBSCRIPTION TYPES
// ============================================================================

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: PlanFeature[];
  limits: PlanLimits;
  isPopular?: boolean;
  isEnterprise?: boolean;
}

export interface PlanFeature {
  name: string;
  description: string;
  included: boolean;
  limit?: number;
}

export interface PlanLimits {
  maxProjects: number;
  maxUsers: number;
  maxKeywords: number;
  maxBacklinks?: number;
  maxAudits?: number;
  apiRequests?: number;
}

export interface SubscriptionWithPlan extends BillingSubscription {
  plan: BillingPlan;
  usage: UsageMetrics;
}

export interface UsageMetrics {
  projects: { current: number; limit: number };
  users: { current: number; limit: number };
  keywords: { current: number; limit: number };
  apiRequests: { current: number; limit: number; resetDate: Date };
}

export interface BillingNotification {
  type: 'renewal' | 'overuse' | 'payment_failed' | 'trial_ending';
  title: string;
  message: string;
  dueDate?: Date;
  amount?: number;
  currency?: string;
  actionRequired: boolean;
  actionUrl?: string;
}

// ============================================================================
// DATA ACCURACY & QUALITY TYPES
// ============================================================================

export interface DataAccuracyMetrics {
  overall: {
    score: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  sources: Array<{
    name: string;
    score: number;
    lastChecked: Date;
    issues: number;
  }>;
  recentChecks: Array<{
    date: Date;
    metric: string;
    expected: number;
    actual: number;
    variance: number;
    isAccurate: boolean;
  }>;
}

export interface DataDiscrepancy {
  id: string;
  projectId: string;
  metric: string;
  primarySource: string;
  secondarySource: string;
  primaryValue: number;
  secondaryValue: number;
  variance: number;
  severity: 'low' | 'medium' | 'high';
  detectedAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

// ============================================================================
// API INTEGRATION TYPES
// ============================================================================

export interface GoogleSearchConsoleCredentials {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
}

export interface SerpApiResponse {
  searchParameters: {
    q: string;
    location: string;
    device: string;
    gl: string;
    hl: string;
  };
  searchInformation: {
    totalResults: number;
    timeTaken: number;
  };
  organicResults: Array<{
    position: number;
    title: string;
    link: string;
    snippet: string;
    displayedLink: string;
  }>;
}

// ============================================================================
// NOTIFICATION & ALERT TYPES
// ============================================================================

export interface NotificationWithData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  status: 'unread' | 'read' | 'archived';
  createdAt: Date;
  readAt?: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  type: 'ranking_change' | 'backlink_change' | 'traffic_change' | 'audit_issue';
  conditions: AlertCondition[];
  actions: AlertAction[];
  isActive: boolean;
}

export interface AlertCondition {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'contains' | 'increases' | 'decreases';
  value: string | number;
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'slack';
  settings: Record<string, unknown>;
}

// ============================================================================
// FORM & VALIDATION TYPES
// ============================================================================

export interface FormField<T = unknown> {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'multiselect' | 'textarea' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  validation?: (value: T) => string | null;
  options?: Array<{ label: string; value: string | number }>;
  defaultValue?: T;
  disabled?: boolean;
  help?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type {
  User,
  Organization,
  Project,
  Keyword,
  Ranking,
  Backlink,
  BillingPlan,
  BillingSubscription,
  SiteAudit,
  GoogleSearchConsoleData,
  GoogleAnalyticsData,
  UserRole,
  UserStatus,
  ProjectStatus,
  SubscriptionStatus,
  KeywordDifficulty,
  BacklinkStatus,
  AuditStatus,
  NotificationType,
  OrganizationMemberRole,
};

// Re-export commonly used utility types
export type { NextApiRequest, NextApiResponse } from 'next';
export type { Session } from 'next-auth';
export type { JWT } from 'next-auth/jwt';