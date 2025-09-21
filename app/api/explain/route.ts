import { NextRequest, NextResponse } from 'next/server'
import { explainPlan } from '../../../lib/replicate'

export async function POST(request: NextRequest) {
  try {
    const { plan, constraints } = await request.json()
    
    if (!plan || !constraints) {
      return NextResponse.json(
        { error: 'Plan and constraints are required' },
        { status: 400 }
      )
    }
    
    // Generate explanation using Replicate
    const explanation = await explainPlan(plan, constraints)
    
    return NextResponse.json({ explanation })
  } catch (error) {
    console.error('Explanation error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    )
  }
}
