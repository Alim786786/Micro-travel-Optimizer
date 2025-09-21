import { Constraint, Stop, Leg, Plan, StopRef } from '../schema'
import { PreferenceWeights } from '../../types/planner'
import { addMinutes, formatTime, parseTime } from '../schema'

export interface OptimizationContext {
  constraints: Constraint
  travelMatrix: Map<string, Map<string, Map<string, number>>>
  preferences: PreferenceWeights
}

export function greedyOptimize(context: OptimizationContext): Plan {
  const { constraints, travelMatrix, preferences } = context
  const { stops, origin, start_after, must_end_by } = constraints
  
  const legs: Leg[] = []
  const visited = new Set<string>()
  const feasibilityNotes: string[] = []
  
  // Start with origin or first time-constrained stop
  let currentStop = origin
  let currentTime = start_after ? parseTime(start_after) : 0
  let currentLocation = origin ? { lat: origin.lat || 0, lon: origin.lon || 0 } : null
  
  // If no origin, start with the earliest time-constrained stop
  if (!currentStop && stops.length > 0) {
    const timeConstrainedStops = stops
      .filter(stop => stop.arrive_window)
      .sort((a, b) => {
        const aTime = parseTime(a.arrive_window![0])
        const bTime = parseTime(b.arrive_window![0])
        return aTime - bTime
      })
    
    if (timeConstrainedStops.length > 0) {
      currentStop = timeConstrainedStops[0]
      currentTime = parseTime(timeConstrainedStops[0].arrive_window![0])
      currentLocation = { lat: currentStop.lat || 0, lon: currentStop.lon || 0 }
    }
  }
  
  // Greedy selection loop
  while (visited.size < stops.length) {
    let bestNextStop: Stop | null = null
    let bestScore = Infinity
    let bestMode: 'transit' | 'drive' | 'walk' = 'drive'
    let bestArrivalTime = 0
    
    for (const stop of stops) {
      if (visited.has(stop.name)) continue
      
      const stopKey = `${stop.lat},${stop.lon}`
      const currentKey = currentLocation ? `${currentLocation.lat},${currentLocation.lon}` : 'origin'
      
      // Try each available mode
      const modes = stop.by ? [stop.by] : ['transit', 'drive', 'walk']
      
      for (const mode of modes) {
        const travelTime = travelMatrix.get(currentKey)?.get(stopKey)?.get(mode) || 0
        
        if (travelTime === 0) continue
        
        const arrivalTime = currentTime + travelTime
        const score = calculateStopScore(
          stop,
          arrivalTime,
          travelTime,
          mode,
          preferences
        )
        
        if (score < bestScore) {
          bestScore = score
          bestNextStop = stop
          bestMode = mode
          bestArrivalTime = arrivalTime
        }
      }
    }
    
    if (!bestNextStop) {
      feasibilityNotes.push('Unable to reach all stops - some may be unreachable')
      break
    }
    
    // Create leg
    const leg: Leg = {
      from: currentStop || { name: 'Origin', lat: currentLocation?.lat || null, lon: currentLocation?.lon || null },
      to: bestNextStop,
      mode: bestMode,
      depart_time: formatTime(currentTime),
      arrive_time: formatTime(bestArrivalTime),
      minutes: bestArrivalTime - currentTime,
      notes: getLegNotes(bestMode, bestNextStop)
    }
    
    legs.push(leg)
    visited.add(bestNextStop.name)
    
    // Update current state
    currentStop = bestNextStop
    currentTime = bestArrivalTime + (bestNextStop.service_min || 10)
    currentLocation = { lat: bestNextStop.lat || 0, lon: bestNextStop.lon || 0 }
  }
  
  // Check if we can meet the end time constraint
  if (must_end_by) {
    const endTime = parseTime(must_end_by)
    if (currentTime > endTime) {
      feasibilityNotes.push(`Cannot meet end time of ${must_end_by} - current plan ends at ${formatTime(currentTime)}`)
    }
  }
  
  const totalMinutes = legs.reduce((sum, leg) => sum + leg.minutes, 0)
  
  return {
    legs,
    total_minutes: totalMinutes,
    feasibility_notes: feasibilityNotes.length > 0 ? feasibilityNotes : undefined,
  }
}

function calculateStopScore(
  stop: Stop,
  arrivalTime: number,
  travelTime: number,
  mode: 'transit' | 'drive' | 'walk',
  preferences: PreferenceWeights
): number {
  let score = travelTime
  
  // Time window penalty
  if (stop.arrive_window) {
    const [windowStart, windowEnd] = stop.arrive_window
    const startTime = parseTime(windowStart)
    const endTime = parseTime(windowEnd)
    
    if (arrivalTime < startTime) {
      // Early arrival - add wait time penalty
      score += (startTime - arrivalTime) * 0.5
    } else if (arrivalTime > endTime) {
      // Late arrival - add heavy penalty
      score += (arrivalTime - endTime) * 30
    }
  }
  
  // Priority penalty (lower priority = higher penalty)
  if (stop.priority) {
    score += (4 - stop.priority) * 10
  }
  
  // Mode preference penalties
  switch (mode) {
    case 'transit':
      score += preferences.transferPenalty
      break
    case 'walk':
      if (travelTime > preferences.walkToleranceMin) {
        score += (travelTime - preferences.walkToleranceMin) * 2
      }
      break
    case 'drive':
      score += preferences.costWeight * 5 // Driving has cost
      break
  }
  
  return score
}

function getLegNotes(mode: 'transit' | 'drive' | 'walk', stop: Stop): string {
  const notes = []
  
  if (mode === 'transit') {
    notes.push('Public transit')
  } else if (mode === 'walk') {
    notes.push('Walking')
  } else {
    notes.push('Driving')
  }
  
  if (stop.arrive_window) {
    const [start, end] = stop.arrive_window
    notes.push(`Arrive between ${start}-${end}`)
  }
  
  return notes.join(' • ')
}
