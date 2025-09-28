import { getPrefStats } from './store'
import { PrefStats } from './types'
import { getShortWalkPreference } from './prefs'

export interface ModeWeights {
  walk: number
  transit: number
  drive: number
}

/**
 * Compute mode preference weights based on telemetry data
 * Uses Laplace smoothing and maps to [0.75, 1.25] range
 */
export function computeModeWeights(distance_m: number): ModeWeights {
  try {
    const stats = getPrefStats()
    
    // Determine distance bucket
    const distanceKm = distance_m / 1000
    let bucket: keyof PrefStats['byDistanceKm']
    
    if (distanceKm < 1) bucket = 'lt1'
    else if (distanceKm < 2) bucket = 'lt2'
    else if (distanceKm < 5) bucket = 'lt5'
    else bucket = 'gte5'
    
    const bucketStats = stats.byDistanceKm[bucket]
    
    // Calculate total selections in this bucket
    const totalInBucket = bucketStats.walk + bucketStats.transit + bucketStats.drive
    
    // If no data, return neutral weights
    if (totalInBucket === 0) {
      return { walk: 1.0, transit: 1.0, drive: 1.0 }
    }
    
    // Compute soft preferences with Laplace smoothing
    const walkPreference = (bucketStats.walk + 1) / (totalInBucket + 3)
    const transitPreference = (bucketStats.transit + 1) / (totalInBucket + 3)
    const drivePreference = (bucketStats.drive + 1) / (totalInBucket + 3)
    
    // Convert to weights in [0.75, 1.25] range
    // Map [0.25, 0.75] to [0.75, 1.25] with 0.5 -> 1.0
    let walkWeight = mapPreferenceToWeight(walkPreference)
    let transitWeight = mapPreferenceToWeight(transitPreference)
    let driveWeight = mapPreferenceToWeight(drivePreference)
    
    // Apply short walk preference bias for distances < 2km
    if (getShortWalkPreference() && distance_m < 2000) {
      // Boost walking preference
      walkWeight = Math.min(1.3, walkWeight * 1.1)
      
      // Slightly downweight other modes
      transitWeight = Math.max(0.8, transitWeight * 0.95)
      driveWeight = Math.max(0.8, driveWeight * 0.95)
    }
    
    return {
      walk: walkWeight,
      transit: transitWeight,
      drive: driveWeight
    }
  } catch (error) {
    console.warn('Failed to compute mode weights:', error)
    return { walk: 1.0, transit: 1.0, drive: 1.0 }
  }
}

/**
 * Map preference value to weight in [0.75, 1.25] range
 * 0.25 -> 0.75, 0.5 -> 1.0, 0.75 -> 1.25
 */
function mapPreferenceToWeight(preference: number): number {
  // Clamp preference to [0.25, 0.75] range (theoretical min/max with Laplace smoothing)
  const clamped = Math.max(0.25, Math.min(0.75, preference))
  
  // Linear mapping: [0.25, 0.75] -> [0.75, 1.25]
  return 0.75 + (clamped - 0.25) * (0.5 / 0.5)
}

/**
 * Get mode weights for a specific mode and distance
 * Convenience function for scoring
 */
export function getModeWeight(mode: 'walk' | 'transit' | 'drive', distance_m: number): number {
  const weights = computeModeWeights(distance_m)
  return weights[mode]
}
