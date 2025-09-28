import { describe, it, expect, beforeEach, vi } from 'vitest'
import { computeModeWeights, getModeWeight, ModeWeights } from '../model'
import { getPrefStats } from '../store'
import { PrefStats } from '../types'

// Mock the store functions
vi.mock('../store', () => ({
  getPrefStats: vi.fn()
}))

const mockGetPrefStats = vi.mocked(getPrefStats)

describe('Personalization Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('computeModeWeights', () => {
    it('should return neutral weights when no data exists', () => {
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

      const weights = computeModeWeights(1000) // 1km
      
      expect(weights).toEqual({
        walk: 1.0,
        transit: 1.0,
        drive: 1.0
      })
    })

    it('should return neutral weights when bucket has no data', () => {
      mockGetPrefStats.mockReturnValue({
        totals: { walk: 5, transit: 3, drive: 2 },
        byDistanceKm: {
          lt1: { walk: 0, transit: 0, drive: 0 }, // No data in lt1 bucket
          lt2: { walk: 3, transit: 2, drive: 1 },
          lt5: { walk: 2, transit: 1, drive: 1 },
          gte5: { walk: 0, transit: 0, drive: 0 }
        },
        lastUpdated: Date.now()
      })

      const weights = computeModeWeights(500) // <1km bucket
      
      expect(weights).toEqual({
        walk: 1.0,
        transit: 1.0,
        drive: 1.0
      })
    })

    it('should compute weights for lt1 bucket with Laplace smoothing', () => {
      mockGetPrefStats.mockReturnValue({
        totals: { walk: 5, transit: 3, drive: 2 },
        byDistanceKm: {
          lt1: { walk: 3, transit: 1, drive: 0 }, // Walk preferred
          lt2: { walk: 2, transit: 2, drive: 1 },
          lt5: { walk: 0, transit: 0, drive: 1 },
          gte5: { walk: 0, transit: 0, drive: 0 }
        },
        lastUpdated: Date.now()
      })

      const weights = computeModeWeights(500) // <1km bucket
      
      // With Laplace smoothing: walk=(3+1)/(4+3)=4/7≈0.57, transit=(1+1)/(4+3)=2/7≈0.29, drive=(0+1)/(4+3)=1/7≈0.14
      // Expected weights: walk should be highest, drive should be lowest
      expect(weights.walk).toBeGreaterThan(weights.transit)
      expect(weights.transit).toBeGreaterThan(weights.drive)
      expect(weights.walk).toBeGreaterThan(1.0) // Preferred mode gets boost
      expect(weights.drive).toBeLessThan(1.0) // Disfavored mode gets penalty
    })

    it('should compute weights for lt2 bucket', () => {
      mockGetPrefStats.mockReturnValue({
        totals: { walk: 5, transit: 3, drive: 2 },
        byDistanceKm: {
          lt1: { walk: 3, transit: 1, drive: 0 },
          lt2: { walk: 1, transit: 2, drive: 1 }, // Transit preferred
          lt5: { walk: 1, transit: 0, drive: 1 },
          gte5: { walk: 0, transit: 0, drive: 0 }
        },
        lastUpdated: Date.now()
      })

      const weights = computeModeWeights(1500) // 1-2km bucket
      
      // Transit should be preferred in this bucket
      expect(weights.transit).toBeGreaterThan(weights.walk)
      expect(weights.transit).toBeGreaterThan(weights.drive)
    })

    it('should compute weights for lt5 bucket', () => {
      mockGetPrefStats.mockReturnValue({
        totals: { walk: 5, transit: 3, drive: 2 },
        byDistanceKm: {
          lt1: { walk: 3, transit: 1, drive: 0 },
          lt2: { walk: 1, transit: 2, drive: 1 },
          lt5: { walk: 0, transit: 0, drive: 2 }, // Drive preferred
          gte5: { walk: 1, transit: 0, drive: 0 }
        },
        lastUpdated: Date.now()
      })

      const weights = computeModeWeights(3000) // 2-5km bucket
      
      // Drive should be preferred in this bucket
      expect(weights.drive).toBeGreaterThan(weights.walk)
      expect(weights.drive).toBeGreaterThan(weights.transit)
    })

    it('should compute weights for gte5 bucket', () => {
      mockGetPrefStats.mockReturnValue({
        totals: { walk: 5, transit: 3, drive: 2 },
        byDistanceKm: {
          lt1: { walk: 3, transit: 1, drive: 0 },
          lt2: { walk: 1, transit: 2, drive: 1 },
          lt5: { walk: 0, transit: 0, drive: 2 },
          gte5: { walk: 0, transit: 1, drive: 0 } // Transit preferred
        },
        lastUpdated: Date.now()
      })

      const weights = computeModeWeights(6000) // 5km+ bucket
      
      // Transit should be preferred in this bucket
      expect(weights.transit).toBeGreaterThan(weights.walk)
      expect(weights.transit).toBeGreaterThan(weights.drive)
    })

    it('should handle equal preferences', () => {
      mockGetPrefStats.mockReturnValue({
        totals: { walk: 3, transit: 3, drive: 3 },
        byDistanceKm: {
          lt1: { walk: 1, transit: 1, drive: 1 }, // Equal preferences
          lt2: { walk: 1, transit: 1, drive: 1 },
          lt5: { walk: 1, transit: 1, drive: 1 },
          gte5: { walk: 0, transit: 0, drive: 0 }
        },
        lastUpdated: Date.now()
      })

      const weights = computeModeWeights(500) // <1km bucket
      
      // All weights should be close to 1.0 (neutral) - with equal preferences, Laplace smoothing gives ~0.83
      expect(weights.walk).toBeCloseTo(0.83, 1)
      expect(weights.transit).toBeCloseTo(0.83, 1)
      expect(weights.drive).toBeCloseTo(0.83, 1)
    })

    it('should handle errors gracefully', () => {
      mockGetPrefStats.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const weights = computeModeWeights(1000)
      
      expect(weights).toEqual({
        walk: 1.0,
        transit: 1.0,
        drive: 1.0
      })
    })

    it('should ensure weights are in valid range [0.75, 1.25]', () => {
      mockGetPrefStats.mockReturnValue({
        totals: { walk: 100, transit: 0, drive: 0 }, // Extreme preference for walking
        byDistanceKm: {
          lt1: { walk: 100, transit: 0, drive: 0 },
          lt2: { walk: 0, transit: 0, drive: 0 },
          lt5: { walk: 0, transit: 0, drive: 0 },
          gte5: { walk: 0, transit: 0, drive: 0 }
        },
        lastUpdated: Date.now()
      })

      const weights = computeModeWeights(500)
      
      // All weights should be within the valid range
      expect(weights.walk).toBeGreaterThanOrEqual(0.75)
      expect(weights.walk).toBeLessThanOrEqual(1.25)
      expect(weights.transit).toBeGreaterThanOrEqual(0.75)
      expect(weights.transit).toBeLessThanOrEqual(1.25)
      expect(weights.drive).toBeGreaterThanOrEqual(0.75)
      expect(weights.drive).toBeLessThanOrEqual(1.25)
    })
  })

  describe('getModeWeight', () => {
    it('should return weight for specific mode', () => {
      mockGetPrefStats.mockReturnValue({
        totals: { walk: 5, transit: 3, drive: 2 },
        byDistanceKm: {
          lt1: { walk: 3, transit: 1, drive: 0 },
          lt2: { walk: 1, transit: 2, drive: 1 },
          lt5: { walk: 1, transit: 0, drive: 1 },
          gte5: { walk: 0, transit: 0, drive: 0 }
        },
        lastUpdated: Date.now()
      })

      const walkWeight = getModeWeight('walk', 500)
      const transitWeight = getModeWeight('transit', 500)
      const driveWeight = getModeWeight('drive', 500)
      
      expect(walkWeight).toBeGreaterThan(transitWeight)
      expect(transitWeight).toBeGreaterThan(driveWeight)
    })
  })
})
