import { PreferenceWeights } from '../types/planner'
import { TravelMode } from './personalization/types'
import { getModeWeight } from './personalization/model'
import { PERSONALIZATION_ENABLED } from './config'

/**
 * Apply personalization to a base score based on user's mode preferences
 * @param baseScore - The original score for this mode/distance combination
 * @param mode - The transportation mode
 * @param distance_m - Distance in meters
 * @returns Modified score with personalization applied
 */
export function applyPersonalization(baseScore: number, mode: TravelMode, distance_m: number): number {
  if (!PERSONALIZATION_ENABLED) {
    return baseScore
  }
  
  try {
    const weight = getModeWeight(mode, distance_m)
    return baseScore * weight
  } catch (error) {
    console.warn('Failed to apply personalization:', error)
    return baseScore
  }
}

export class PreferenceScorer {
  private weights: PreferenceWeights
  private learningRate = 0.1
  
  constructor() {
    this.weights = {
      transferPenalty: 5,
      costWeight: 1,
      timeWeight: 1,
      walkToleranceMin: 15,
    }
  }
  
  getWeights(): PreferenceWeights {
    return { ...this.weights }
  }
  
  updateFromUserChoice(
    chosenPlan: any,
    rejectedPlan: any,
    userOverrides: { mode?: string; droppedStops?: string[] }
  ): void {
    // Simple learning: if user chose a plan with more transfers, reduce transfer penalty
    const chosenTransfers = this.countTransfers(chosenPlan)
    const rejectedTransfers = this.countTransfers(rejectedPlan)
    
    if (chosenTransfers > rejectedTransfers) {
      this.weights.transferPenalty *= (1 - this.learningRate)
    } else if (chosenTransfers < rejectedTransfers) {
      this.weights.transferPenalty *= (1 + this.learningRate)
    }
    
    // If user overrode mode choices, adjust preferences
    if (userOverrides.mode === 'transit') {
      this.weights.transferPenalty *= (1 - this.learningRate)
    } else if (userOverrides.mode === 'drive') {
      this.weights.costWeight *= (1 - this.learningRate)
    } else if (userOverrides.mode === 'walk') {
      this.weights.walkToleranceMin *= (1 + this.learningRate)
    }
    
    // If user dropped stops, increase time weight
    if (userOverrides.droppedStops && userOverrides.droppedStops.length > 0) {
      this.weights.timeWeight *= (1 + this.learningRate)
    }
    
    // Ensure weights stay within reasonable bounds
    this.weights.transferPenalty = Math.max(0, Math.min(20, this.weights.transferPenalty))
    this.weights.costWeight = Math.max(0.1, Math.min(5, this.weights.costWeight))
    this.weights.timeWeight = Math.max(0.1, Math.min(5, this.weights.timeWeight))
    this.weights.walkToleranceMin = Math.max(5, Math.min(60, this.weights.walkToleranceMin))
  }
  
  private countTransfers(plan: any): number {
    if (!plan?.legs) return 0
    
    let transfers = 0
    let lastMode = null
    
    for (const leg of plan.legs) {
      if (lastMode && lastMode !== leg.mode) {
        transfers++
      }
      lastMode = leg.mode
    }
    
    return transfers
  }
  
  calculatePlanScore(plan: any): number {
    if (!plan?.legs) return Infinity
    
    let score = 0
    
    for (const leg of plan.legs) {
      score += leg.minutes * this.weights.timeWeight
      
      if (leg.mode === 'transit') {
        score += this.weights.transferPenalty
      } else if (leg.mode === 'drive') {
        score += this.weights.costWeight * 5
      }
    }
    
    return score
  }
}

// Global instance for session-based learning
export const preferenceScorer = new PreferenceScorer()
