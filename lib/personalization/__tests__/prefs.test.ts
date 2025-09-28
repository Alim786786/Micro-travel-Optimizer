import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getShortWalkPreference, setShortWalkPreference } from '../prefs'

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

describe('Short Walk Preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getShortWalkPreference', () => {
    it('should return false when no preference is set', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const result = getShortWalkPreference()
      
      expect(result).toBe(false)
      expect(localStorageMock.getItem).toHaveBeenCalledWith('mc.pref.shortwalk')
    })

    it('should return true when preference is set to true', () => {
      localStorageMock.getItem.mockReturnValue('true')
      
      const result = getShortWalkPreference()
      
      expect(result).toBe(true)
    })

    it('should return false when preference is set to false', () => {
      localStorageMock.getItem.mockReturnValue('false')
      
      const result = getShortWalkPreference()
      
      expect(result).toBe(false)
    })

    it('should return false when window is undefined (SSR)', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window
      
      const result = getShortWalkPreference()
      
      expect(result).toBe(false)
      
      // Restore window
      global.window = originalWindow
    })

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      const result = getShortWalkPreference()
      
      expect(result).toBe(false)
    })
  })

  describe('setShortWalkPreference', () => {
    it('should set preference to true', () => {
      setShortWalkPreference(true)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('mc.pref.shortwalk', 'true')
    })

    it('should set preference to false', () => {
      setShortWalkPreference(false)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('mc.pref.shortwalk', 'false')
    })

    it('should handle window undefined (SSR)', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window
      
      setShortWalkPreference(true)
      
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
      
      // Restore window
      global.window = originalWindow
    })

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      // Should not throw
      expect(() => setShortWalkPreference(true)).not.toThrow()
    })
  })
})
