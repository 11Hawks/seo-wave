#!/usr/bin/env node
/**
 * Add service initialization calls inside route handlers
 */

import * as fs from 'fs'

function fixRouteHandler(content) {
  // Pattern: Find export async function and add service init at the start
  const functionRegex = /(export\s+async\s+function\s+\w+\([^)]*\)\s*\{\s*(?:\/\/[^\n]*\n\s*)*try\s*\{)/g
  
  let modified = content
  let hasRedis = content.includes('redis.')
  let hasPrisma = content.includes('prisma.')
  
  if (!hasRedis && !hasPrisma) {
    return content
  }
  
  // Check if already has initialization
  if (content.includes('const redis = getRedisClient()') || content.includes('const prisma = getPrismaClient()')) {
    return content
  }
  
  modified = modified.replace(functionRegex, (match) => {
    const initLines = []
    if (hasRedis) {
      initLines.push('    const redis = getRedisClient()')
    }
    if (hasPrisma) {
      initLines.push('    const prisma = getPrismaClient()')
    }
    
    if (initLines.length > 0) {
      return match + '\n' + initLines.join('\n') + '\n'
    }
    return match
  })
  
  return modified
}

const files = [
  'src/app/api/google/analytics/callback/route.ts',
  'src/app/api/google/analytics/auth/route.ts',
  'src/app/api/google/search-console/callback/route.ts',
  'src/app/api/keywords/simple/route.ts'
]

console.log('\nAdding service initialization to route handlers...\n')

for (const file of files) {
  try {
    let content = fs.readFileSync(file, 'utf-8')
    const fixed = fixRouteHandler(content)
    
    if (fixed !== content) {
      fs.writeFileSync(file, fixed)
      console.log(`  ✓ Fixed ${file}`)
    } else {
      console.log(`  - Skipped ${file} (already fixed or no changes needed)`)
    }
  } catch (err) {
    console.error(`  ✗ Error with ${file}:`, err.message)
  }
}

console.log('\nDone!\n')
