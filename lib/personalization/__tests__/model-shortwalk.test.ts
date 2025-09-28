import { describe, it, expect, beforeEach, vi } from 'vitest'
import { computeModeWeights, getModeWeight, ModeWeights } from '../model'
import { getPrefStats } from '../store'
import { getShortWalkPreference } from '../prefs'
import { PrefStats } from '../types'

// Mock dependencies
vi.mock('../store', () => ({
  getPrefStats: vi.fn()
}))

vi.mock('../prefs', () => ({
  getShortWalkPreference: vi.fn()
}))

const mockGetPrefStats = vi.mocked(getPrefStats)
const mockGetShortWalkPreference = vi.mocked(getShortWalkPreference)

describe('Personalization Model with Short Walk Preference', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('computeModeWeights with short walk preference', () => {
    it('should apply short walk bias when preference is enabled and distance < 2km', () => {
      mockGetPrefStats.mockReturnValue({
        totals: { walk: 0, transit: 0, drive: 0 },
        byDistanceKm: {
          lt1: { walk: 0, transit: 0, drive: 0 },
          lt2: { walk: 0, transit: 0, drive: 0 },
          lt5: { walk: 0, transit: 0, drive: 0 },
          gte5: { walk: 0, transit: 0, drive: 0 }
        },
        lastUpdated: Date.now()
      })
      mockGetShortWalkPreference.mockReturnValue(true)

      const weights = computeModeWeights(1500) // 1.5km - should trigger bias
      
      // Walking should be boosted, others should be slightly downweighted
      expect(weights.walk).toBeGreaterThan(1.0) // Boosted from 1.0 to 1.1
      expect(weights.transit).toBeLessThan(1.0) // Downweighted from 1.0 to 0.95
      expect(weights.drive).toBeLessThan(1.0) // Downweighted from 1.0 to 0.95
    })

    it('should not apply short walk bias when preference is disabled', () => {
      mockGetPrefStats.mockReturnValue({
        totals: { walk: 0, transit: 0, drive: 0 },
        byDistanceKm: {
          lt1: { walk: 0, transit: 0, drive: 0 },
          lt2: { walk: 0, transit: 0, drive: 0 },
          lt5: { walk: 0, transit: 0, drive: 0 },
          gte5: { walk: 0, transit: 0, drive: 0 }
        },
        lastUpdated: Date.now()
      })
      mockGetShortWalkPreference.mockReturnValue(false)

      const weights = computeModeWeights(1500) // 1.5km
      
      // All weights should be neutral
      expect(weights.walk).toBe(1.0)
      expect(weights.transit).toBe(1.0)
      expect(weights.drive).toBe(1.0)
    })

    it('should not apply short walk bias when distance >= 2km', () => {
      mockGetPrefStats.mockReturnValue({
        totals: { walk: 0, transit: 0, drive: 0 },
        byDistanceKm: {
          lt1: { walk: 0, transit: 0, drive: 0 },
          lt2: { walk: 0, transit: 0, drive: 0 },
          lt5: { walk: 0, transit: 0, drive: 0 },
          gte5: { walk: 0, transit: 0, drive: 0 }
        },
        lastUpdated: Date.now()
      })
      mockGetShortWalkPreference.mockReturnValue(true)

      const weights = computeModeWeights(2500) // 2.5km - should NOT trigger bias
      
      // All weights should be neutral
      expect(weights.walk).toBe(1.0)
      expect(weights.transit).toBe(1.0)
      expect(weights.drive).toBe(1.0)
    })

    it('should cap walk weight at 1.3 when combined with telemetry', () => {
      mockGetPrefStats.mockReturnValue({
        totals: { walk: 100, transit: 0, drive: 0 }, // Extreme walk preference
        byDistanceKm: {
          lt1: { walk: 100, transit: 0, drive: 0 },
          lt2: { walk: 0, transit: 0, drive: 0 },
          lt5: { walk: 0, transit: 0, drive: 0 },
          gte5: { walk: 0, transit: 0, drive: 0 }
        },
        lastUpdated: Date.now()
      })
      mockGetShortWalkPreference.mockReturnValue(true)

      const weights = computeModeWeights(500) // <1km with extreme walk preference + short walk bias
      
      // Walk weight should be capped at 1.3
      expect(weights.walk).toBeLessThanOrEqual(1.3)
    })

    it('should cap transit/drive weights at 0.8 when downweighted', () => {
      mockGetPrefStats.mockReturnValue({
        totals: { walk: 0, transit: 0, drive: 0 },
        byDistanceKm: {
          lt1: { walk: 0, transit: 0, drive: 0 },
          lt2: { walk: 0, transit: 0, drive: 0 },
          lt5: { walk: 0, transit: 0, drive: 0 },
          gte5: { walk: 0, transit: 0, drive: 0 }
        },
        lastUpdated: Date.now()
      })
      mockGetShortWalkPreference.mockReturnValue(true)

      const weights = computeModeWeights(1500) // 1.5km
      
      // Transit and drive should be downweighted but not below 0.8
      expect(weights.transit).toBeGreaterThanOrEqual(0.8)
      expect(weights.drive).toBeGreaterThanOrEqual(0.8)
    })

    it('should combine cleanly with telemetry-based weights', () => {
      mockGetPrefStats.mockReturnValue({
        totals: { walk: 5, transit: 3, drive: 2 },
        byDistanceKm: {
          lt1: { walk: 2, transit: 1, drive: 0 }, // Walk preferred in telemetry
          lt2: { walk: 1, transit: 2, drive: 1 },
          lt5: { walk: 2, transit: 0, drive: 1 },
          gte5: { walk: 0, transit: 0, drive: 0 }
        },
        lastUpdated: Date.now()
      })
      mockGetShortWalkPreference.mockReturnValue(true)

      const weights = computeModeWeights(500) // <1km bucket
      
      // Walk should be most preferred (telemetry + short walk bias)
      expect(weights.walk).toBeGreaterThan(weights.transit)
      expect(weights.walk).toBeGreaterThan(weights.drive)
      
      // All weights should be within valid range
      expect(weights.walk).toBeLessThanOrEqual(1.3)
      expect(weights.transit).toBeGreaterThanOrEqual(0.8)
      expect(weights.drive).toBeGreaterThanOrEqual(0.8)
    })
  })
})
