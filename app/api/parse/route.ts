import { NextRequest, NextResponse } from 'next/server'
import { parseConstraints } from '../../../lib/replicate'
import { Constraint } from '../../../lib/schema'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text input is required' },
        { status: 400 }
      )
    }
    
    // Parse constraints using Replicate
    const rawConstraints = await parseConstraints(text)
    
    // Validate with Zod schema
    const constraints = Constraint.parse(rawConstraints)
    
    return NextResponse.json({ constraints })
  } catch (error) {
    console.error('Parse error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to parse constraints' },
      { status: 500 }
    )
  }
}
