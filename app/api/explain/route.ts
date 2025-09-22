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
    
    // Generate explanation using fallback method
    const explanation = generateFallbackExplanation(plan, constraints)
    
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

function generateFallbackExplanation(plan: any, constraints: any): string {
  const totalTime = plan.total_minutes
  const totalHours = Math.floor(totalTime / 60)
  const totalMins = totalTime % 60
  const numStops = plan.legs.length
  
  let explanation = `🚀 **Your Optimized Commute Plan**\n\n`
  
  // Overview
  explanation += `**Overview:** This plan covers ${numStops} stops with a total travel time of ${totalHours}h ${totalMins}m. `
  
  if (constraints.start_after && constraints.must_end_by) {
    explanation += `You'll start at ${constraints.start_after} and finish by ${constraints.must_end_by}. `
  }
  
  explanation += `The route is optimized for efficiency while respecting your time constraints.\n\n`
  
  // Step-by-step plan
  explanation += `**Step-by-Step Plan:**\n`
  
  plan.legs.forEach((leg: any, index: number) => {
    const stepNum = index + 1
    const fromName = leg.from.name
    const toName = leg.to.name
    const mode = leg.mode
    const departTime = leg.depart_time
    const arriveTime = leg.arrive_time
    const duration = leg.minutes
    
    explanation += `${stepNum}. 🚶 **${fromName} → ${toName}**\n`
    explanation += `   Depart: ${departTime} | Arrive: ${arriveTime} | Duration: ${duration} min\n`
    explanation += `   Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}\n`
    
    if (leg.notes) {
      explanation += `   Notes: ${leg.notes}\n`
    }
    
    explanation += `\n`
  })
  
  // Feasibility notes
  if (plan.feasibility_notes && plan.feasibility_notes.length > 0) {
    explanation += `**⚠️ Important Notes:**\n`
    plan.feasibility_notes.forEach((note: string) => {
      explanation += `• ${note}\n`
    })
    explanation += `\n`
  }
  
  // Alternatives
  explanation += `**Alternative Options:**\n`
  explanation += `• **Faster Route:** Consider driving for shorter travel times\n`
  explanation += `• **Cheaper Route:** Use walking or public transit to save money\n`
  explanation += `• **Flexible Timing:** Adjust service times at stops if needed\n\n`
  
  // Tips
  explanation += `**💡 Tips for Success:**\n`
  explanation += `• Leave a few minutes early to account for delays\n`
  explanation += `• Check real-time transit updates before departure\n`
  explanation += `• Consider weather conditions for walking segments\n`
  explanation += `• Have backup plans for high-priority stops\n\n`
  
  explanation += `This plan is designed to be practical and achievable. Safe travels! 🎯`
  
  return explanation
}
