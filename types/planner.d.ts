// Global type definitions for the commute optimizer

declare global {
  interface Window {
    mapboxgl?: any
  }
}

export interface GeocodeResult {
  lat: number
  lon: number
  name: string
  address?: string
}

export interface TravelTimeResult {
  minutes: number
  notes?: string
}

export interface RoutingProvider {
  geocode(query: string): Promise<GeocodeResult[]>
  travelTime(
    from: { lat: number; lon: number },
    to: { lat: number; lon: number },
    mode: 'drive' | 'walk' | 'transit',
    departISO?: string
  ): Promise<TravelTimeResult>
  routePolyline?(
    from: { lat: number; lon: number },
    to: { lat: number; lon: number },
    mode: 'drive' | 'walk' | 'transit',
    departISO?: string
  ): Promise<string>
}

export interface PreferenceWeights {
  transferPenalty: number
  costWeight: number
  timeWeight: number
  walkToleranceMin: number
}

export interface OptimizationContext {
  constraints: import('./lib/schema').Constraint
  travelMatrix: Map<string, Map<string, Map<string, number>>>
  preferences: PreferenceWeights
}

export {}
