/**
 * Simple Keywords API Routes
 * Basic CRUD operations for keyword management (simplified version)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/keywords/simple - List keywords for a project
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Get keywords for the project
    const keywords = await prisma.keyword.findMany({
      where: { projectId },
      include: {
        rankings: {
          take: 1,
          orderBy: { date: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({
      keywords: keywords.map(keyword => ({
        id: keyword.id,
        keyword: keyword.keyword,
        projectId: keyword.projectId,
        searchVolume: keyword.searchVolume,
        difficulty: keyword.difficulty,
        tags: keyword.tags,
        category: keyword.category,
        priority: keyword.priority,
        currentPosition: keyword.rankings[0]?.position || null,
        lastTracked: keyword.rankings[0]?.date || keyword.rankings[0]?.checkedAt || null,
        createdAt: keyword.createdAt,
        updatedAt: keyword.updatedAt
      })),
      total: keywords.length,
      success: true
    })

  } catch (error) {
    console.error('Keywords GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/keywords/simple - Create a new keyword
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { projectId, keyword, searchVolume, difficulty, tags, category, priority } = body

    if (!projectId || !keyword) {
      return NextResponse.json({ 
        error: 'Project ID and keyword are required' 
      }, { status: 400 })
    }

    // Check for duplicate
    const existingKeyword = await prisma.keyword.findFirst({
      where: {
        projectId,
        keyword: { equals: keyword, mode: 'insensitive' }
      }
    })

    if (existingKeyword) {
      return NextResponse.json({
        error: 'Keyword already exists in this project',
        existingKeyword: {
          id: existingKeyword.id,
          keyword: existingKeyword.keyword
        }
      }, { status: 409 })
    }

    // Create keyword
    const newKeyword = await prisma.keyword.create({
      data: {
        projectId,
        keyword: keyword.trim(),
        searchVolume: searchVolume || null,
        difficulty: difficulty || null,
        tags: tags || [],
        category: category || null,
        priority: priority || 'medium'
      }
    })

    return NextResponse.json({
      keyword: newKeyword,
      message: 'Keyword created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Keywords POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/keywords/simple - Delete a keyword
export async function DELETE(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const keywordId = searchParams.get('id')

    if (!keywordId) {
      return NextResponse.json({ error: 'Keyword ID is required' }, { status: 400 })
    }

    // Delete keyword and related data
    await prisma.$transaction(async (tx) => {
      // Delete related records first
      await tx.ranking.deleteMany({
        where: { keywordId }
      })
      
      await tx.keywordAccuracy.deleteMany({
        where: { keywordId }
      })

      // Delete keyword
      await tx.keyword.delete({
        where: { id: keywordId }
      })
    })

    return NextResponse.json({
      message: 'Keyword deleted successfully'
    })

  } catch (error) {
    console.error('Keywords DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}