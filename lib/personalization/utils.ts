import { Plan, Leg } from '../schema'
import { TravelMode } from './types'

/**
 * Determine the primary mode of a plan based on the most used mode
 */
export function getPrimaryMode(plan: Plan): TravelMode {
  const modeCounts: Record<TravelMode, number> = {
    walk: 0,
    transit: 0,
    drive: 0
  }
  
  for (const leg of plan.legs) {
    modeCounts[leg.mode as TravelMode]++
  }
  
  // Return the mode with the highest count
  return Object.entries(modeCounts).reduce((a, b) => 
    modeCounts[a[0] as TravelMode] > modeCounts[b[0] as TravelMode] ? a : b
  )[0] as TravelMode
}

/**
 * Calculate total distance in meters for a plan
 * Note: This is a simplified calculation based on straight-line distance
 * In a real implementation, you'd want to use actual routing distances
 */
export function getTotalDistanceMeters(plan: Plan): number {
  let totalDistance = 0
  
  for (const leg of plan.legs) {
    if (leg.from.lat && leg.from.lon && leg.to.lat && leg.to.lon) {
      // Calculate straight-line distance using Haversine formula
      const distance = calculateDistance(
        leg.from.lat, leg.from.lon,
        leg.to.lat, leg.to.lon
      )
      totalDistance += distance
    }
  }
  
  return Math.round(totalDistance)
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}
