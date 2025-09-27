/**
 * Accuracy Notification System
 * Real-time alerts for data accuracy issues and confidence changes
 */

import { PrismaClient, NotificationType } from '@prisma/client'
import { AccuracyReport, Discrepancy, ConfidenceScore } from './data-accuracy-engine'

export interface AccuracyAlert {
  id: string
  type: AccuracyAlertType
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  projectId: string
  metric: string
  message: string
  data: Record<string, any>
  triggeredAt: Date
}

export enum AccuracyAlertType {
  CONFIDENCE_DROP = 'CONFIDENCE_DROP',
  CRITICAL_DISCREPANCY = 'CRITICAL_DISCREPANCY',
  DATA_STALE = 'DATA_STALE',
  SOURCE_UNAVAILABLE = 'SOURCE_UNAVAILABLE',
  ACCURACY_THRESHOLD_BREACH = 'ACCURACY_THRESHOLD_BREACH',
  CONSISTENCY_ISSUE = 'CONSISTENCY_ISSUE'
}

export interface NotificationSettings {
  userId: string
  projectId: string
  enableAccuracyAlerts: boolean
  confidenceThreshold: number // Alert if confidence drops below this
  discrepancyThreshold: number // Alert if discrepancy exceeds this
  dataFreshnessHours: number // Alert if data is older than this
  emailNotifications: boolean
  webNotifications: boolean
}

/**
 * Accuracy Notification Manager
 */
export class AccuracyNotificationManager {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Process accuracy report and trigger alerts if needed
   */
  async processAccuracyReport(report: AccuracyReport): Promise<AccuracyAlert[]> {
    const alerts: AccuracyAlert[] = []

    // Get notification settings for the project
    const settings = await this.getNotificationSettings(report.projectId)
    if (!settings || !settings.enableAccuracyAlerts) {
      return alerts
    }

    // Check for confidence drop
    if (report.confidenceScore.overall < settings.confidenceThreshold) {
      alerts.push(await this.createConfidenceAlert(report, settings))
    }

    // Check for critical discrepancies
    const criticalDiscrepancies = report.discrepancies.filter(
      d => d.severity === 'CRITICAL'
    )
    if (criticalDiscrepancies.length > 0) {
      alerts.push(await this.createDiscrepancyAlert(report, criticalDiscrepancies, settings))
    }

    // Check for data staleness
    const dataAge = Date.now() - report.checkedAt.getTime()
    const hoursOld = dataAge / (1000 * 60 * 60)
    if (hoursOld > settings.dataFreshnessHours) {
      alerts.push(await this.createStaleDataAlert(report, hoursOld, settings))
    }

    // Check for consistency issues
    if (report.confidenceScore.consistency < 50) {
      alerts.push(await this.createConsistencyAlert(report, settings))
    }

    // Send notifications for all alerts
    for (const alert of alerts) {
      await this.sendAlert(alert, settings)
    }

    return alerts
  }

  /**
   * Create confidence drop alert
   */
  private async createConfidenceAlert(
    report: AccuracyReport,
    settings: NotificationSettings
  ): Promise<AccuracyAlert> {
    const severity = this.getConfidenceSeverity(report.confidenceScore.overall)
    
    const alert: AccuracyAlert = {
      id: `confidence_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type: AccuracyAlertType.CONFIDENCE_DROP,
      severity,
      projectId: report.projectId,
      metric: report.metric,
      message: `Confidence score dropped to ${report.confidenceScore.overall}% for ${report.metric}`,
      data: {
        confidenceScore: report.confidenceScore,
        threshold: settings.confidenceThreshold,
        previousScore: await this.getPreviousConfidenceScore(report.projectId, report.metric),
      },
      triggeredAt: new Date(),
    }

    return alert
  }

  /**
   * Create discrepancy alert
   */
  private async createDiscrepancyAlert(
    report: AccuracyReport,
    discrepancies: Discrepancy[],
    settings: NotificationSettings
  ): Promise<AccuracyAlert> {
    const maxVariance = Math.max(...discrepancies.map(d => d.variance))
    const severity = maxVariance > 0.5 ? 'CRITICAL' : 'HIGH'
    
    const alert: AccuracyAlert = {
      id: `discrepancy_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type: AccuracyAlertType.CRITICAL_DISCREPANCY,
      severity,
      projectId: report.projectId,
      metric: report.metric,
      message: `Critical data discrepancy detected for ${report.metric} (${Math.round(maxVariance * 100)}% variance)`,
      data: {
        discrepancies,
        maxVariance,
        affectedSources: discrepancies.map(d => [d.source1, d.source2]).flat(),
      },
      triggeredAt: new Date(),
    }

    return alert
  }

  /**
   * Create stale data alert
   */
  private async createStaleDataAlert(
    report: AccuracyReport,
    hoursOld: number,
    settings: NotificationSettings
  ): Promise<AccuracyAlert> {
    const severity = hoursOld > 72 ? 'HIGH' : 'MEDIUM'
    
    const alert: AccuracyAlert = {
      id: `stale_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type: AccuracyAlertType.DATA_STALE,
      severity,
      projectId: report.projectId,
      metric: report.metric,
      message: `Data for ${report.metric} is ${Math.round(hoursOld)} hours old`,
      data: {
        hoursOld: Math.round(hoursOld),
        threshold: settings.dataFreshnessHours,
        lastUpdate: report.checkedAt,
      },
      triggeredAt: new Date(),
    }

    return alert
  }

  /**
   * Create consistency alert
   */
  private async createConsistencyAlert(
    report: AccuracyReport,
    settings: NotificationSettings
  ): Promise<AccuracyAlert> {
    const alert: AccuracyAlert = {
      id: `consistency_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type: AccuracyAlertType.CONSISTENCY_ISSUE,
      severity: 'MEDIUM',
      projectId: report.projectId,
      metric: report.metric,
      message: `Data consistency issues detected for ${report.metric} (${report.confidenceScore.consistency}% consistency score)`,
      data: {
        consistencyScore: report.confidenceScore.consistency,
        sourcesCount: report.secondaryValues.length,
        discrepancyCount: report.discrepancies.length,
      },
      triggeredAt: new Date(),
    }

    return alert
  }

  /**
   * Send alert through configured channels
   */
  private async sendAlert(alert: AccuracyAlert, settings: NotificationSettings): Promise<void> {
    try {
      // Create web notification in database
      if (settings.webNotifications) {
        await this.createWebNotification(alert, settings.userId)
      }

      // TODO: Implement email notifications
      if (settings.emailNotifications) {
        await this.sendEmailNotification(alert, settings)
      }

      // TODO: Implement webhook notifications for integrations
      await this.sendWebhookNotification(alert)

    } catch (error) {
      console.error('Failed to send accuracy alert:', error)
    }
  }

  /**
   * Create web notification in database
   */
  private async createWebNotification(
    alert: AccuracyAlert,
    userId: string
  ): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId,
        type: NotificationType.SYSTEM_ALERT,
        title: this.getAlertTitle(alert),
        message: alert.message,
        data: alert.data,
      },
    })
  }

  /**
   * Send email notification (placeholder)
   */
  private async sendEmailNotification(
    alert: AccuracyAlert,
    settings: NotificationSettings
  ): Promise<void> {
    // TODO: Implement email service integration
    console.log('Email notification would be sent:', {
      alert: alert.type,
      severity: alert.severity,
      message: alert.message,
      userId: settings.userId,
    })
  }

  /**
   * Send webhook notification (placeholder)
   */
  private async sendWebhookNotification(alert: AccuracyAlert): Promise<void> {
    // TODO: Implement webhook integration for third-party services
    console.log('Webhook notification would be sent:', {
      type: alert.type,
      severity: alert.severity,
      projectId: alert.projectId,
      metric: alert.metric,
    })
  }

  /**
   * Get notification settings for a project
   */
  private async getNotificationSettings(
    projectId: string
  ): Promise<NotificationSettings | null> {
    // TODO: Implement user settings storage
    // For now, return default settings
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })

    if (!project) return null

    return {
      userId: project.userId,
      projectId,
      enableAccuracyAlerts: true,
      confidenceThreshold: 70,
      discrepancyThreshold: 0.3,
      dataFreshnessHours: 24,
      emailNotifications: true,
      webNotifications: true,
    }
  }

  /**
   * Get alert title based on type
   */
  private getAlertTitle(alert: AccuracyAlert): string {
    const titles: Record<AccuracyAlertType, string> = {
      [AccuracyAlertType.CONFIDENCE_DROP]: 'Data Confidence Alert',
      [AccuracyAlertType.CRITICAL_DISCREPANCY]: 'Data Discrepancy Alert',
      [AccuracyAlertType.DATA_STALE]: 'Stale Data Alert',
      [AccuracyAlertType.SOURCE_UNAVAILABLE]: 'Data Source Alert',
      [AccuracyAlertType.ACCURACY_THRESHOLD_BREACH]: 'Accuracy Alert',
      [AccuracyAlertType.CONSISTENCY_ISSUE]: 'Data Consistency Alert',
    }

    return titles[alert.type] || 'Data Quality Alert'
  }

  /**
   * Get confidence severity level
   */
  private getConfidenceSeverity(confidence: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (confidence >= 80) return 'LOW'
    if (confidence >= 60) return 'MEDIUM'
    if (confidence >= 40) return 'HIGH'
    return 'CRITICAL'
  }

  /**
   * Get previous confidence score for comparison
   */
  private async getPreviousConfidenceScore(
    projectId: string,
    metric: string
  ): Promise<number | null> {
    const previousReport = await this.prisma.dataAccuracyReport.findFirst({
      where: {
        projectId,
        metric,
      },
      orderBy: {
        checkedAt: 'desc',
      },
      skip: 1, // Skip the current report
      take: 1,
    })

    return previousReport?.confidenceScore || null
  }

  /**
   * Get active alerts for a project
   */
  async getActiveAlerts(projectId: string): Promise<AccuracyAlert[]> {
    // TODO: Implement alert storage and retrieval
    // For now, return empty array
    return []
  }

  /**
   * Mark alert as resolved
   */
  async resolveAlert(alertId: string, userId: string): Promise<boolean> {
    try {
      // TODO: Implement alert resolution
      console.log('Alert resolved:', { alertId, userId })
      return true
    } catch (error) {
      console.error('Failed to resolve alert:', error)
      return false
    }
  }

  /**
   * Get alert statistics for a project
   */
  async getAlertStatistics(
    projectId: string,
    days = 30
  ): Promise<{
    total: number
    critical: number
    high: number
    medium: number
    low: number
    resolved: number
    byType: Record<AccuracyAlertType, number>
  }> {
    // TODO: Implement alert statistics
    return {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      resolved: 0,
      byType: {
        [AccuracyAlertType.CONFIDENCE_DROP]: 0,
        [AccuracyAlertType.CRITICAL_DISCREPANCY]: 0,
        [AccuracyAlertType.DATA_STALE]: 0,
        [AccuracyAlertType.SOURCE_UNAVAILABLE]: 0,
        [AccuracyAlertType.ACCURACY_THRESHOLD_BREACH]: 0,
        [AccuracyAlertType.CONSISTENCY_ISSUE]: 0,
      },
    }
  }
}