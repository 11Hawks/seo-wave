#!/usr/bin/env node
/**
 * Automated fix for module-level service initializations
 */

import * as fs from 'fs'

const filesToFix = [
  'src/app/api/google/analytics/auth/route.ts',
  'src/app/api/google/analytics/callback/route.ts',
  'src/app/api/google/search-console/auth/route.ts',
  'src/app/api/google/search-console/callback/route.ts',
  'src/app/api/keywords/simple/route.ts'
]

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8')
  let modified = false
  
  // Check if file has module-level Redis or Prisma initialization
  const hasModuleRedis = /^const redis = new Redis\(/m.test(content)
  const hasModulePrisma = /^const prisma = new PrismaClient\(/m.test(content)
  
  if (!hasModuleRedis && !hasModulePrisma) {
    console.log(`  ✓ ${filePath} - Already fixed or no issues`)
    return
  }
  
  console.log(`  Fixing ${filePath}...`)
  
  // Remove module-level Redis initialization
  if (hasModuleRedis) {
    content = content.replace(/^const redis = new Redis\([^)]*\)\s*$/gm, '')
    modified = true
  }
  
  // Remove module-level Prisma initialization
  if (hasModulePrisma) {
    content = content.replace(/^const prisma = new PrismaClient\([^)]*\)\s*$/gm, '')
    modified = true
  }
  
  // Add service factory import if not present
  if (modified && !content.includes('getRedisClient') && !content.includes('getPrismaClient')) {
    // Find the import section
    const importMatch = content.match(/(import[^]*?)(\n\n|\nexport)/s)
    if (importMatch) {
      const imports = importMatch[1]
      const rest = content.slice(importMatch.index + importMatch[1].length)
      
      // Build list of needed imports
      const neededImports = []
      if (hasModuleRedis) neededImports.push('getRedisClient')
      if (hasModulePrisma) neededImports.push('getPrismaClient')
      
      const newImport = `import { ${neededImports.join(', ')} } from '@/lib/service-factory'\n`
      content = imports + '\n' + newImport + rest
    }
  }
  
  // Add rate limiting import and usage if missing
  if (!content.includes('rateLimitAPI')) {
    // Add import
    const importMatch = content.match(/(import[^]*?)(\n\n|\nexport)/s)
    if (importMatch) {
      const imports = importMatch[1]
      const rest = content.slice(importMatch.index + importMatch[1].length)
      const newImport = `import { rateLimitAPI } from '@/lib/rate-limiting-unified'\n`
      content = imports + '\n' + newImport + rest
    }
  }
  
  // Clean up multiple blank lines
  content = content.replace(/\n\n\n+/g, '\n\n')
  
  fs.writeFileSync(filePath, content)
  console.log(`    ✓ Fixed`)
}

console.log('\nFixing module-level service initializations...\n')

for (const file of filesToFix) {
  try {
    fixFile(file)
  } catch (err) {
    console.error(`    ✗ Error fixing ${file}:`, err.message)
  }
}

console.log('\nDone!\n')
