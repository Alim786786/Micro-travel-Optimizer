import { TelemetryEvent, PrefStats, TravelMode } from './types'

const TELEMETRY_KEY = 'mc.telemetry'
const PREF_STATS_KEY = 'mc.pref.stats'

/**
 * Get all telemetry events from localStorage
 */
export function getTelemetry(): TelemetryEvent[] {
  try {
    if (typeof window === 'undefined') {
      return []
    }
    const stored = localStorage.getItem(TELEMETRY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.warn('Failed to get telemetry from localStorage:', error)
    return []
  }
}

/**
 * Append a new telemetry event to localStorage
 */
export function appendTelemetry(event: TelemetryEvent): void {
  try {
    if (typeof window === 'undefined') {
      return
    }
    const existing = getTelemetry()
    const updated = [...existing, event]
    localStorage.setItem(TELEMETRY_KEY, JSON.stringify(updated))
    
    // Clear cached stats since we have new data
    localStorage.removeItem(PREF_STATS_KEY)
  } catch (error) {
    console.warn('Failed to append telemetry to localStorage:', error)
  }
}

/**
 * Convert distance in meters to km bucket
 */
function getDistanceBucket(distanceM: number): keyof PrefStats['byDistanceKm'] {
  const distanceKm = distanceM / 1000
  if (distanceKm < 1) return 'lt1'
  if (distanceKm < 2) return 'lt2'
  if (distanceKm < 5) return 'lt5'
  return 'gte5'
}

/**
 * Initialize empty preference stats
 */
function createEmptyPrefStats(): PrefStats {
  const emptyModeCounts = { walk: 0, transit: 0, drive: 0 }
  return {
    totals: { ...emptyModeCounts },
    byDistanceKm: {
      lt1: { ...emptyModeCounts },
      lt2: { ...emptyModeCounts },
      lt5: { ...emptyModeCounts },
      gte5: { ...emptyModeCounts }
    },
    lastUpdated: Date.now()
  }
}

/**
 * Compute preference statistics from telemetry events
 */
function computePrefStats(events: TelemetryEvent[]): PrefStats {
  const stats = createEmptyPrefStats()
  
  for (const event of events) {
    if (!event.chosen_mode) continue
    
    // Increment total counts
    stats.totals[event.chosen_mode]++
    
    // Increment distance bucket counts if distance is available
    if (event.distance_m !== undefined) {
      const bucket = getDistanceBucket(event.distance_m)
      stats.byDistanceKm[bucket][event.chosen_mode]++
    }
  }
  
  stats.lastUpdated = Date.now()
  return stats
}

/**
 * Get preference statistics, computing from telemetry if not cached
 */
export function getPrefStats(): PrefStats {
  try {
    // Try to get cached stats first
    const cached = localStorage.getItem(PREF_STATS_KEY)
    if (cached) {
      const parsed = JSON.parse(cached) as PrefStats
      // Verify the structure is valid
      if (parsed.totals && parsed.byDistanceKm && parsed.lastUpdated) {
        return parsed
      }
    }
    
    // Compute from telemetry
    const events = getTelemetry()
    const stats = computePrefStats(events)
    
    // Cache the computed stats
    localStorage.setItem(PREF_STATS_KEY, JSON.stringify(stats))
    
    return stats
  } catch (error) {
    console.warn('Failed to get preference stats:', error)
    return createEmptyPrefStats()
  }
}

/**
 * Clear all personalization data
 */
export function clearPersonalization(): void {
  try {
    localStorage.removeItem(TELEMETRY_KEY)
    localStorage.removeItem(PREF_STATS_KEY)
  } catch (error) {
    console.warn('Failed to clear personalization data:', error)
  }
}
