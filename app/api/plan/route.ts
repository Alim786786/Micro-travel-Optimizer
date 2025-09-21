import { NextRequest, NextResponse } from 'next/server'
import { Constraint, Plan } from '../../../lib/schema'
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
    
    // Create routing provider
    const routingProvider = createRoutingProvider()
    
    // Geocode any stops without coordinates
    const geocodedStops = await Promise.all(
      validatedConstraints.stops.map(async (stop) => {
        if (stop.lat && stop.lon) {
          return stop
        }
        
        const results = await routingProvider.geocode(stop.name)
        if (results.length > 0) {
          const result = results[0]
          return {
            ...stop,
            lat: result.lat,
            lon: result.lon,
            address: result.address || stop.name,
          }
        }
        
        return stop
      })
    )
    
    // Update constraints with geocoded stops
    const updatedConstraints = {
      ...validatedConstraints,
      stops: geocodedStops,
    }
    
    // Build travel time matrix
    const travelMatrix = await buildTravelMatrix(updatedConstraints, routingProvider)
    
    // Get current preferences
    const preferences = preferenceScorer.getWeights()
    
    // Optimize using greedy algorithm
    const context = {
      constraints: updatedConstraints,
      travelMatrix,
      preferences,
    }
    
    let plan = greedyOptimize(context)
    
    // Apply 2-opt improvement
    plan = twoOptImprovement(plan)
    
    // Generate alternatives
    const alternatives = await generateAlternatives(updatedConstraints, travelMatrix, preferences)
    
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
): Promise<Map<string, Map<string, Map<string, number>>> {
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
