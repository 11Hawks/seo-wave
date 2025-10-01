import { NextRequest, NextResponse } from 'next/server'
import { rateLimitAPI } from '@/lib/rate-limiting-unified'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'

const authSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export async function POST(request: NextRequest) {
  try {
    // Apply strict rate limiting for auth endpoints
    const rateLimitResult = await rateLimitAPI(request, 'auth', 10)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many authentication attempts' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset?.toString() || ''
          }
        }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = authSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input data',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { email, password } = validationResult.data

    // In preview mode, return mock authentication
    if (process.env.NODE_ENV === 'test' || process.env.PREVIEW_MODE === 'true') {
      const mockUser = {
        id: 1,
        email,
        name: 'Test User',
        createdAt: new Date().toISOString()
      }

      const token = jwt.sign(
        { userId: mockUser.id, email: mockUser.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      )

      return NextResponse.json({
        user: mockUser,
        token
      }, {
        status: 200,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset?.toString() || ''
        }
      })
    }

    // Production authentication logic
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.password || '')
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    )

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      },
      token
    }, {
      status: 200,
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.reset?.toString() || ''
      }
    })

  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}