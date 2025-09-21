import { Plan, Leg } from '../schema'
import { addMinutes, formatTime, parseTime } from '../schema'

export function twoOptImprovement(plan: Plan): Plan {
  const legs = [...plan.legs]
  let improved = true
  let iterations = 0
  const maxIterations = 10
  
  while (improved && iterations < maxIterations) {
    improved = false
    iterations++
    
    for (let i = 0; i < legs.length - 1; i++) {
      for (let j = i + 2; j < legs.length; j++) {
        const newLegs = twoOptSwap(legs, i, j)
        const newPlan = calculatePlanFromLegs(newLegs)
        
        if (newPlan.total_minutes < plan.total_minutes) {
          legs.splice(0, legs.length, ...newLegs)
          plan = newPlan
          improved = true
          break
        }
      }
      if (improved) break
    }
  }
  
  return plan
}

function twoOptSwap(legs: Leg[], i: number, j: number): Leg[] {
  const newLegs = [...legs]
  
  // Reverse the segment between i and j
  for (let k = i; k <= j; k++) {
    const leg = newLegs[k]
    newLegs[k] = {
      ...leg,
      from: leg.to,
      to: leg.from,
      depart_time: leg.arrive_time,
      arrive_time: leg.depart_time,
    }
  }
  
  // Reverse the order of the segment
  const segment = newLegs.slice(i, j + 1).reverse()
  newLegs.splice(i, j - i + 1, ...segment)
  
  return newLegs
}

function calculatePlanFromLegs(legs: Leg[]): Plan {
  const totalMinutes = legs.reduce((sum, leg) => sum + leg.minutes, 0)
  
  return {
    legs,
    total_minutes: totalMinutes,
  }
}
