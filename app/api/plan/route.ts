import { NextRequest, NextResponse } from 'next/server'
import { Constraint, Plan, Leg } from '../../../lib/schema'
import { createRoutingProvider } from '../../../lib/routing'
import { greedyOptimize } from '../../../lib/optimize/greedy'
import { twoOptImprovement } from '../../../lib/optimize/twoOpt'
import { preferenceScorer } from '../../../lib/scoring'

export async function POST(request: NextRequest) {
  try {
    const { constraints } = await request.json()
    
    if (!constraints) {
      return NextResponse.json(
        { error: 'Constraints are required' },
        { status: 400 }
      )
    }
    
    // Validate constraints
    const validatedConstraints = Constraint.parse(constraints)
    
    // Create a simple fallback plan
    const plan = createFallbackPlan(validatedConstraints)
    
    // Generate simple alternatives
    const alternatives = {
      faster: createFasterPlan(validatedConstraints),
      cheaper: createCheaperPlan(validatedConstraints)
    }
    
    return NextResponse.json({
      plan,
      alternatives,
      feasibility_notes: plan.feasibility_notes,
    })
  } catch (error) {
    console.error('Planning error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate plan' },
      { status: 500 }
    )
  }
}

async function buildTravelMatrix(
  constraints: Constraint,
  routingProvider: any
): Promise<Map<string, Map<string, Map<string, number>>>> {
  const matrix = new Map()
  const allStops = [
    ...(constraints.origin ? [constraints.origin] : []),
    ...constraints.stops,
  ]
  
  for (const fromStop of allStops) {
    if (!fromStop.lat || !fromStop.lon) continue
    
    const fromKey = `${fromStop.lat},${fromStop.lon}`
    matrix.set(fromKey, new Map())
    
    for (const toStop of allStops) {
      if (!toStop.lat || !toStop.lon) continue
      if (fromStop === toStop) continue
      
      const toKey = `${toStop.lat},${toStop.lon}`
      matrix.get(fromKey).set(toKey, new Map())
      
      // Get travel times for each mode
      const modes = ['drive', 'walk', 'transit']
      for (const mode of modes) {
        try {
          const result = await routingProvider.travelTime(
            { lat: fromStop.lat!, lon: fromStop.lon! },
            { lat: toStop.lat!, lon: toStop.lon! },
            mode as 'drive' | 'walk' | 'transit'
          )
          matrix.get(fromKey).get(toKey).set(mode, result.minutes)
        } catch (error) {
          console.warn(`Failed to get ${mode} time from ${fromStop.name} to ${toStop.name}:`, error)
          // Use fallback estimation
          const distance = calculateDistance(
            { lat: fromStop.lat!, lon: fromStop.lon! },
            { lat: toStop.lat!, lon: toStop.lon! }
          )
          const estimatedTime = estimateTravelTime(distance, mode as 'drive' | 'walk' | 'transit')
          matrix.get(fromKey).get(toKey).set(mode, estimatedTime)
        }
      }
    }
  }
  
  return matrix
}

async function generateAlternatives(
  constraints: Constraint,
  travelMatrix: Map<string, Map<string, Map<string, number>>>,
  preferences: any
) {
  // Faster alternative: prefer driving, reduce service times
  const fasterConstraints = {
    ...constraints,
    stops: constraints.stops.map(stop => ({
      ...stop,
      by: stop.by || 'drive',
      service_min: Math.max(5, (stop.service_min || 10) - 5),
    })),
    preferences: {
      ...constraints.preferences,
      modePriority: ['drive', 'transit', 'walk'],
    },
  }
  
  // Cheaper alternative: prefer transit/walk, accept longer transfers
  const cheaperConstraints = {
    ...constraints,
    stops: constraints.stops.map(stop => ({
      ...stop,
      by: stop.by || 'transit',
    })),
    preferences: {
      ...constraints.preferences,
      modePriority: ['transit', 'walk', 'drive'],
      minimizeCost: true,
    },
  }
  
  const fasterPreferences = { ...preferences, transferPenalty: 2, costWeight: 0.5 }
  const cheaperPreferences = { ...preferences, transferPenalty: 1, costWeight: 2 }
  
  const fasterContext = {
    constraints: fasterConstraints,
    travelMatrix,
    preferences: fasterPreferences,
  }
  
  const cheaperContext = {
    constraints: cheaperConstraints,
    travelMatrix,
    preferences: cheaperPreferences,
  }
  
  const fasterPlan = twoOptImprovement(greedyOptimize(fasterContext))
  const cheaperPlan = twoOptImprovement(greedyOptimize(cheaperContext))
  
  return {
    faster: fasterPlan,
    cheaper: cheaperPlan,
  }
}

function calculateDistance(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number }
): number {
  const R = 6371 // Earth's radius in km
  const dLat = (to.lat - from.lat) * Math.PI / 180
  const dLon = (to.lon - from.lon) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

function estimateTravelTime(distanceKm: number, mode: 'drive' | 'walk' | 'transit'): number {
  const speeds = {
    drive: 30, // km/h in city
    walk: 5,   // km/h
    transit: 20, // km/h average
  }
  
  return Math.round((distanceKm / speeds[mode]) * 60)
}

function createFallbackPlan(constraints: Constraint): Plan {
  const legs: Leg[] = []
  const feasibilityNotes: string[] = []
  
  let currentTime = constraints.start_after ? parseTime(constraints.start_after) : 0
  let currentStop = constraints.origin
  
  // Create legs for each stop
  for (const stop of constraints.stops) {
    if (currentStop) {
      const leg: Leg = {
        from: currentStop,
        to: stop,
        mode: stop.by || 'transit',
        depart_time: formatTime(currentTime),
        arrive_time: formatTime(currentTime + 30), // 30 min travel time
        minutes: 30,
        notes: `Travel to ${stop.name}`
      }
      legs.push(leg)
      currentTime += 30 + (stop.service_min || 10)
    }
    currentStop = stop
  }
  
  // Check end time constraint
  if (constraints.must_end_by) {
    const endTime = parseTime(constraints.must_end_by)
    if (currentTime > endTime) {
      feasibilityNotes.push(`Cannot meet end time of ${constraints.must_end_by} - current plan ends at ${formatTime(currentTime)}`)
    }
  }
  
  const totalMinutes = legs.reduce((sum, leg) => sum + leg.minutes, 0)
  
  return {
    legs,
    total_minutes: totalMinutes,
    feasibility_notes: feasibilityNotes.length > 0 ? feasibilityNotes : undefined,
  }
}

function createFasterPlan(constraints: Constraint): Plan {
  const legs: Leg[] = []
  
  let currentTime = constraints.start_after ? parseTime(constraints.start_after) : 0
  let currentStop = constraints.origin
  
  // Create faster legs (20 min travel time)
  for (const stop of constraints.stops) {
    if (currentStop) {
      const leg: Leg = {
        from: currentStop,
        to: stop,
        mode: 'drive', // Faster mode
        depart_time: formatTime(currentTime),
        arrive_time: formatTime(currentTime + 20),
        minutes: 20,
        notes: `Fast travel to ${stop.name}`
      }
      legs.push(leg)
      currentTime += 20 + (stop.service_min || 5) // Reduced service time
    }
    currentStop = stop
  }
  
  const totalMinutes = legs.reduce((sum, leg) => sum + leg.minutes, 0)
  
  return {
    legs,
    total_minutes: totalMinutes,
  }
}

function createCheaperPlan(constraints: Constraint): Plan {
  const legs: Leg[] = []
  
  let currentTime = constraints.start_after ? parseTime(constraints.start_after) : 0
  let currentStop = constraints.origin
  
  // Create cheaper legs (40 min travel time, walking/transit)
  for (const stop of constraints.stops) {
    if (currentStop) {
      const leg: Leg = {
        from: currentStop,
        to: stop,
        mode: 'walk', // Cheaper mode
        depart_time: formatTime(currentTime),
        arrive_time: formatTime(currentTime + 40),
        minutes: 40,
        notes: `Budget travel to ${stop.name}`
      }
      legs.push(leg)
      currentTime += 40 + (stop.service_min || 15) // Longer service time
    }
    currentStop = stop
  }
  
  const totalMinutes = legs.reduce((sum, leg) => sum + leg.minutes, 0)
  
  return {
    legs,
    total_minutes: totalMinutes,
  }
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}
