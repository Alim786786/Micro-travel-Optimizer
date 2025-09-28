import { describe, it, expect, beforeEach, vi } from 'vitest'
import { applyPersonalization } from '../../scoring'
import { getModeWeight } from '../model'
import { PERSONALIZATION_ENABLED } from '../../config'

// Mock dependencies
vi.mock('../model', () => ({
  getModeWeight: vi.fn()
}))

vi.mock('../../config', () => ({
  PERSONALIZATION_ENABLED: true
}))

const mockGetModeWeight = vi.mocked(getModeWeight)

describe('Scoring Personalization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('applyPersonalization', () => {
    it('should return original score when personalization is disabled', async () => {
      // Temporarily override the config
      const originalConfig = await import('../../config')
      vi.doMock('../../config', () => ({
        PERSONALIZATION_ENABLED: false
      }))

      const result = applyPersonalization(100, 'transit', 2000)
      
      expect(result).toBe(100)
      expect(mockGetModeWeight).not.toHaveBeenCalled()
    })

    it('should apply personalization weight to score', () => {
      mockGetModeWeight.mockReturnValue(1.2) // 20% boost for transit

      const result = applyPersonalization(100, 'transit', 2000)
      
      expect(result).toBe(120) // 100 * 1.2
      expect(mockGetModeWeight).toHaveBeenCalledWith('transit', 2000)
    })

    it('should apply penalty weight to score', () => {
      mockGetModeWeight.mockReturnValue(0.8) // 20% penalty for walking

      const result = applyPersonalization(100, 'walk', 500)
      
      expect(result).toBe(80) // 100 * 0.8
      expect(mockGetModeWeight).toHaveBeenCalledWith('walk', 500)
    })

    it('should handle neutral weight', () => {
      mockGetModeWeight.mockReturnValue(1.0) // No change

      const result = applyPersonalization(100, 'drive', 3000)
      
      expect(result).toBe(100) // 100 * 1.0
      expect(mockGetModeWeight).toHaveBeenCalledWith('drive', 3000)
    })

    it('should handle errors gracefully', () => {
      mockGetModeWeight.mockImplementation(() => {
        throw new Error('Weight calculation error')
      })

      const result = applyPersonalization(100, 'transit', 2000)
      
      expect(result).toBe(100) // Returns original score on error
    })

    it('should work with different modes and distances', () => {
      mockGetModeWeight
        .mockReturnValueOnce(1.1) // walk, 500m
        .mockReturnValueOnce(0.9) // transit, 2000m
        .mockReturnValueOnce(1.3) // drive, 5000m

      const walkResult = applyPersonalization(50, 'walk', 500)
      const transitResult = applyPersonalization(75, 'transit', 2000)
      const driveResult = applyPersonalization(200, 'drive', 5000)
      
      expect(walkResult).toBeCloseTo(55, 1) // 50 * 1.1
      expect(transitResult).toBeCloseTo(67.5, 1) // 75 * 0.9
      expect(driveResult).toBeCloseTo(260, 1) // 200 * 1.3
      
      expect(mockGetModeWeight).toHaveBeenCalledTimes(3)
    })
  })
})
