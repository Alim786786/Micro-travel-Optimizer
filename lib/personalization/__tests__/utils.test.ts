import { describe, it, expect } from 'vitest'
import { getPrimaryMode, getTotalDistanceMeters } from '../utils'
import { Plan } from '../../schema'

describe('Personalization Utils', () => {
  describe('getPrimaryMode', () => {
    it('should return the most used mode', () => {
      const plan: Plan = {
        legs: [
          { from: { name: 'A' }, to: { name: 'B' }, mode: 'transit', depart_time: '10:00', arrive_time: '10:30', minutes: 30 },
          { from: { name: 'B' }, to: { name: 'C' }, mode: 'transit', depart_time: '10:30', arrive_time: '11:00', minutes: 30 },
          { from: { name: 'C' }, to: { name: 'D' }, mode: 'walk', depart_time: '11:00', arrive_time: '11:15', minutes: 15 }
        ],
        total_minutes: 75
      }
      
      expect(getPrimaryMode(plan)).toBe('transit')
    })

    it('should handle ties by returning the first alphabetically', () => {
      const plan: Plan = {
        legs: [
          { from: { name: 'A' }, to: { name: 'B' }, mode: 'drive', depart_time: '10:00', arrive_time: '10:30', minutes: 30 },
          { from: { name: 'B' }, to: { name: 'C' }, mode: 'walk', depart_time: '10:30', arrive_time: '10:45', minutes: 15 }
        ],
        total_minutes: 45
      }
      
      expect(getPrimaryMode(plan)).toBe('drive')
    })
  })

  describe('getTotalDistanceMeters', () => {
    it('should calculate total distance for a plan', () => {
      const plan: Plan = {
        legs: [
          { 
            from: { name: 'A', lat: 43.6532, lon: -79.3832 }, 
            to: { name: 'B', lat: 43.6426, lon: -79.3871 }, 
            mode: 'walk', 
            depart_time: '10:00', 
            arrive_time: '10:30', 
            minutes: 30 
          },
          { 
            from: { name: 'B', lat: 43.6426, lon: -79.3871 }, 
            to: { name: 'C', lat: 43.6532, lon: -79.3832 }, 
            mode: 'transit', 
            depart_time: '10:30', 
            arrive_time: '11:00', 
            minutes: 30 
          }
        ],
        total_minutes: 60
      }
      
      const distance = getTotalDistanceMeters(plan)
      expect(distance).toBeGreaterThan(0)
      expect(typeof distance).toBe('number')
    })

    it('should handle missing coordinates gracefully', () => {
      const plan: Plan = {
        legs: [
          { 
            from: { name: 'A' }, 
            to: { name: 'B' }, 
            mode: 'walk', 
            depart_time: '10:00', 
            arrive_time: '10:30', 
            minutes: 30 
          }
        ],
        total_minutes: 30
      }
      
      const distance = getTotalDistanceMeters(plan)
      expect(distance).toBe(0)
    })
  })
})
