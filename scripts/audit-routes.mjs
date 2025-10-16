#!/usr/bin/env node
/**
 * API Route Auditing Script
 * Detects: undefined functions, module-level services, missing rate limits, missing error handlers
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class RouteAuditor {
  constructor() {
    this.issues = []
  }

  findRouteFiles(dir) {
    const results = []
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        results.push(...this.findRouteFiles(fullPath))
      } else if (entry.name === 'route.ts') {
        results.push(fullPath)
      }
    }
    
    return results
  }

  async auditAllRoutes() {
    const apiDir = path.join(__dirname, '..', 'src', 'app', 'api')
    const routeFiles = this.findRouteFiles(apiDir)
    
    console.log(`\nFound ${routeFiles.length} API routes to audit...\n`)
    
    for (const file of routeFiles) {
      this.auditRoute(file)
    }
    
    const summary = {
      critical: this.issues.filter(i => i.severity === 'critical').length,
      warning: this.issues.filter(i => i.severity === 'warning').length,
      info: this.issues.filter(i => i.severity === 'info').length
    }
    
    return {
      totalRoutes: routeFiles.length,
      routesWithIssues: new Set(this.issues.map(i => i.file)).size,
      issues: this.issues,
      summary
    }
  }

  auditRoute(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    const relativePath = path.relative(process.cwd(), filePath)
    
    // Extract imports
    const imports = this.extractImports(content)
    
    // Run checks
    this.checkUndefinedFunctions(relativePath, lines, imports)
    this.checkModuleLevelServices(relativePath, lines)
    this.checkRateLimiting(relativePath, content, lines)
    this.checkErrorHandling(relativePath, lines)
  }

  extractImports(content) {
    const imports = new Map()
    const importRegex = /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/g
    
    let match
    while ((match = importRegex.exec(content)) !== null) {
      const namedImports = match[1]
      const defaultImport = match[2]
      const source = match[3]
      
      const importList = []
      
      if (namedImports) {
        namedImports.split(',').forEach(imp => {
          const cleaned = imp.trim().replace(/^type\s+/, '')
          const name = cleaned.split(/\s+as\s+/)[0].trim()
          importList.push(name)
        })
      }
      
      if (defaultImport) {
        importList.push(defaultImport)
      }
      
      imports.set(source, importList)
    }
    
    return imports
  }

  checkUndefinedFunctions(file, lines, imports) {
    // Get all imported function names
    const importedFunctions = new Set()
    imports.forEach(funcs => funcs.forEach(f => importedFunctions.add(f)))
    
    lines.forEach((line, index) => {
      // Check for rateLimit vs rateLimitAPI inconsistency
      if (line.includes('await rateLimit(') && !line.includes('rateLimitAPI')) {
        const hasRateLimit = importedFunctions.has('rateLimit')
        const hasRateLimitAPI = importedFunctions.has('rateLimitAPI')
        
        if (!hasRateLimit && hasRateLimitAPI) {
          this.issues.push({
            file,
            line: index + 1,
            type: 'import-mismatch',
            severity: 'critical',
            message: `Using 'rateLimit' but only 'rateLimitAPI' is imported`,
            suggestion: `Change 'rateLimit' to 'rateLimitAPI' or add 'rateLimit' to imports`
          })
        }
      }
    })
  }

  checkModuleLevelServices(file, lines) {
    const servicePatterns = [
      { pattern: /^(?:const|let)\s+redis\s*=\s*new\s+Redis\s*\(/, service: 'Redis' },
      { pattern: /^(?:const|let)\s+prisma\s*=\s*new\s+PrismaClient\s*\(/, service: 'Prisma' },
      { pattern: /^(?:const|let)\s+supabase\s*=\s*createClient\s*\(/, service: 'Supabase' }
    ]
    
    let inExportFunction = false
    let bracketDepth = 0
    
    lines.forEach((line, index) => {
      const trimmed = line.trim()
      
      // Track if we're inside an exported function
      if (trimmed.startsWith('export async function') || trimmed.startsWith('export function')) {
        inExportFunction = true
        bracketDepth = 0
      }
      
      if (inExportFunction) {
        bracketDepth += (line.match(/{/g) || []).length
        bracketDepth -= (line.match(/}/g) || []).length
        
        if (bracketDepth === 0 && trimmed === '}') {
          inExportFunction = false
        }
      }
      
      // Check for service initialization outside functions
      if (!inExportFunction) {
        servicePatterns.forEach(({ pattern, service }) => {
          if (pattern.test(trimmed)) {
            this.issues.push({
              file,
              line: index + 1,
              type: 'module-service-init',
              severity: 'warning',
              message: `${service} client initialized at module level`,
              suggestion: `Move initialization inside route handler to prevent build-time failures`
            })
          }
        })
      }
    })
  }

  checkRateLimiting(file, content, lines) {
    // Skip health and trpc routes (known working patterns)
    if (file.includes('/health/') || file.includes('/trpc/')) {
      return
    }
    
    const hasRateLimiting = /rateLimitAPI|rateLimit/.test(content)
    const hasExportedFunction = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)/.test(content)
    
    if (hasExportedFunction && !hasRateLimiting) {
      this.issues.push({
        file,
        line: 1,
        type: 'missing-rate-limit',
        severity: 'warning',
        message: 'Route handler missing rate limiting',
        suggestion: 'Add rateLimitAPI call at the start of the handler'
      })
    }
  }

  checkErrorHandling(file, lines) {
    let currentFunction = ''
    let hasTryCatch = false
    let functionStartLine = 0
    
    lines.forEach((line, index) => {
      const trimmed = line.trim()
      
      // Detect function start
      const functionMatch = trimmed.match(/export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)/)
      if (functionMatch) {
        // Report previous function if needed
        if (currentFunction && !hasTryCatch) {
          this.issues.push({
            file,
            line: functionStartLine,
            type: 'missing-error-handler',
            severity: 'warning',
            message: `${currentFunction} handler missing try-catch block`,
            suggestion: 'Wrap handler logic in try-catch for proper error handling'
          })
        }
        
        currentFunction = functionMatch[1]
        hasTryCatch = false
        functionStartLine = index + 1
      }
      
      // Check for try-catch
      if (trimmed.startsWith('try {')) {
        hasTryCatch = true
      }
    })
    
    // Check last function
    if (currentFunction && !hasTryCatch) {
      this.issues.push({
        file,
        line: functionStartLine,
        type: 'missing-error-handler',
        severity: 'warning',
        message: `${currentFunction} handler missing try-catch block`,
        suggestion: 'Wrap handler logic in try-catch for proper error handling'
      })
    }
  }
}

// Main execution
async function main() {
  const auditor = new RouteAuditor()
  const report = await auditor.auditAllRoutes()
  
  console.log('='.repeat(80))
  console.log('API ROUTE AUDIT REPORT')
  console.log('='.repeat(80))
  console.log()
  console.log(`Total routes scanned: ${report.totalRoutes}`)
  console.log(`Routes with issues: ${report.routesWithIssues}`)
  console.log()
  console.log('Issue Summary:')
  console.log(`  🔴 Critical: ${report.summary.critical}`)
  console.log(`  🟡 Warning: ${report.summary.warning}`)
  console.log(`  🔵 Info: ${report.summary.info}`)
  console.log()
  
  if (report.issues.length > 0) {
    console.log('Detailed Issues:')
    console.log('-'.repeat(80))
    
    // Group by severity
    const criticalIssues = report.issues.filter(i => i.severity === 'critical')
    const warningIssues = report.issues.filter(i => i.severity === 'warning')
    
    if (criticalIssues.length > 0) {
      console.log('\n🔴 CRITICAL ISSUES (Must Fix):')
      criticalIssues.forEach(issue => {
        console.log(`\n  File: ${issue.file}:${issue.line}`)
        console.log(`  Type: ${issue.type}`)
        console.log(`  Issue: ${issue.message}`)
        if (issue.suggestion) {
          console.log(`  Fix: ${issue.suggestion}`)
        }
      })
    }
    
    if (warningIssues.length > 0) {
      console.log('\n🟡 WARNINGS (Should Fix):')
      warningIssues.forEach(issue => {
        console.log(`\n  File: ${issue.file}:${issue.line}`)
        console.log(`  Type: ${issue.type}`)
        console.log(`  Issue: ${issue.message}`)
        if (issue.suggestion) {
          console.log(`  Fix: ${issue.suggestion}`)
        }
      })
    }
  } else {
    console.log('✅ No issues found! All routes look good.')
  }
  
  console.log()
  console.log('='.repeat(80))
  
  // Save report to file
  const reportPath = path.join(process.cwd(), 'audit-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\nDetailed report saved to: ${reportPath}`)
  
  // Exit with error code if critical issues found
  if (report.summary.critical > 0) {
    process.exit(1)
  }
}

main().catch(console.error)
