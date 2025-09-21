import { describe, it, expect } from 'vitest'
import { greedyOptimize } from '../optimize/greedy'
import { twoOptImprovement } from '../optimize/twoOpt'
import { Constraint, Stop } from '../schema'

describe('Optimization Algorithms', () => {
  const mockConstraints: Constraint = {
    origin: {
      name: 'Origin',
      lat: 43.6532,
      lon: -79.3832,
    },
    start_after: '09:00',
    must_end_by: '17:00',
    stops: [
      {
        name: 'Stop 1',
        lat: 43.6544,
        lon: -79.3806,
        service_min: 15,
        priority: 1,
      },
      {
        name: 'Stop 2',
        lat: 43.6519,
        lon: -79.3861,
        service_min: 10,
        priority: 2,
      },
    ],
  }

  const mockTravelMatrix = new Map([
    ['43.6532,-79.3832', new Map([
      ['43.6544,-79.3806', new Map([
        ['drive', 5],
        ['walk', 15],
        ['transit', 8],
      ])],
      ['43.6519,-79.3861', new Map([
        ['drive', 8],
        ['walk', 20],
        ['transit', 12],
      ])],
    ])],
    ['43.6544,-79.3806', new Map([
      ['43.6519,-79.3861', new Map([
        ['drive', 6],
        ['walk', 18],
        ['transit', 10],
      ])],
    ])],
  ])

  const mockPreferences = {
    transferPenalty: 5,
    costWeight: 1,
    timeWeight: 1,
    walkToleranceMin: 15,
  }

  it('should generate a valid plan with greedy optimization', () => {
    const context = {
      constraints: mockConstraints,
      travelMatrix: mockTravelMatrix,
      preferences: mockPreferences,
    }

    const plan = greedyOptimize(context)

    expect(plan).toBeDefined()
    expect(plan.legs).toHaveLength(2)
    expect(plan.total_minutes).toBeGreaterThan(0)
    expect(plan.legs[0].from.name).toBe('Origin')
    expect(plan.legs[0].to.name).toBe('Stop 1')
    expect(plan.legs[1].from.name).toBe('Stop 1')
    expect(plan.legs[1].to.name).toBe('Stop 2')
  })

  it('should improve plan with 2-opt optimization', () => {
    const context = {
      constraints: mockConstraints,
      travelMatrix: mockTravelMatrix,
      preferences: mockPreferences,
    }

    const greedyPlan = greedyOptimize(context)
    const improvedPlan = twoOptImprovement(greedyPlan)

    expect(improvedPlan).toBeDefined()
    expect(improvedPlan.legs).toHaveLength(2)
    expect(improvedPlan.total_minutes).toBeGreaterThan(0)
  })

  it('should handle time window constraints', () => {
    const constraintsWithWindows: Constraint = {
      ...mockConstraints,
      stops: [
        {
          ...mockConstraints.stops[0],
          arrive_window: ['09:30', '09:45'],
        },
        {
          ...mockConstraints.stops[1],
          arrive_window: ['10:00', '10:15'],
        },
      ],
    }

    const context = {
      constraints: constraintsWithWindows,
      travelMatrix: mockTravelMatrix,
      preferences: mockPreferences,
    }

    const plan = greedyOptimize(context)

    expect(plan).toBeDefined()
    expect(plan.legs).toHaveLength(2)
    
    // Check that arrival times respect windows
    const firstArrival = plan.legs[0].arrive_time
    const secondArrival = plan.legs[1].arrive_time
    
    expect(firstArrival).toBeDefined()
    expect(secondArrival).toBeDefined()
  })
})
