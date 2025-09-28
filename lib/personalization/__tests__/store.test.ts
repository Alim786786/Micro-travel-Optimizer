import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getTelemetry, appendTelemetry, getPrefStats, clearPersonalization } from '../store'
import { TelemetryEvent } from '../types'

// Mock localStorage for Node.js environment
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

// Mock global localStorage
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
})

describe('Personalization Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('getTelemetry', () => {
    it('should return empty array when no data exists', () => {
      const result = getTelemetry()
      expect(result).toEqual([])
      expect(localStorageMock.getItem).toHaveBeenCalledWith('mc.telemetry')
    })

    it('should return parsed telemetry data', () => {
      const mockData: TelemetryEvent[] = [
        {
          ts: Date.now(),
          event: 'plan_chosen',
          chosen_mode: 'transit',
          distance_m: 5000
        }
      ]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData))
      
      const result = getTelemetry()
      expect(result).toEqual(mockData)
    })

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      const result = getTelemetry()
      expect(result).toEqual([])
    })
  })

  describe('appendTelemetry', () => {
    it('should append new event to existing telemetry', () => {
      const existingData: TelemetryEvent[] = [
        {
          ts: Date.now() - 1000,
          event: 'plan_chosen',
          chosen_mode: 'walk'
        }
      ]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingData))
      
      const newEvent: TelemetryEvent = {
        ts: Date.now(),
        event: 'mode_overridden',
        chosen_mode: 'drive'
      }
      
      appendTelemetry(newEvent)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mc.telemetry',
        JSON.stringify([...existingData, newEvent])
      )
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('mc.pref.stats')
    })

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      const event: TelemetryEvent = {
        ts: Date.now(),
        event: 'plan_chosen',
        chosen_mode: 'transit'
      }
      
      // Should not throw
      expect(() => appendTelemetry(event)).not.toThrow()
    })
  })

  describe('getPrefStats', () => {
    it('should compute stats from telemetry data', () => {
      const mockTelemetry: TelemetryEvent[] = [
        {
          ts: Date.now() - 2000,
          event: 'plan_chosen',
          chosen_mode: 'transit',
          distance_m: 3000
        },
        {
          ts: Date.now() - 1000,
          event: 'plan_chosen',
          chosen_mode: 'walk',
          distance_m: 500
        },
        {
          ts: Date.now(),
          event: 'mode_overridden',
          chosen_mode: 'drive'
        }
      ]
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'mc.telemetry') return JSON.stringify(mockTelemetry)
        if (key === 'mc.pref.stats') return null
        return null
      })
      localStorageMock.setItem.mockImplementation(() => {}) // Mock setItem to not throw
      
      const stats = getPrefStats()
      
      expect(stats.totals.transit).toBe(1)
      expect(stats.totals.walk).toBe(1)
      expect(stats.totals.drive).toBe(1)
      expect(stats.byDistanceKm.lt1.walk).toBe(1)
      expect(stats.byDistanceKm.lt5.transit).toBe(1)
      expect(stats.lastUpdated).toBeGreaterThan(0)
    })
  })

  describe('clearPersonalization', () => {
    it('should clear all personalization data', () => {
      clearPersonalization()
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('mc.telemetry')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('mc.pref.stats')
    })
  })
})
