import { RoutingProvider, GeocodeResult, TravelTimeResult } from '../../types/planner'

export class OpenRouteServiceProvider implements RoutingProvider {
  private apiKey: string
  private baseUrl = 'https://api.openrouteservice.org/v2'

  constructor() {
    this.apiKey = process.env.ORS_API_KEY || ''
    if (!this.apiKey) {
      throw new Error('ORS_API_KEY environment variable is required')
    }
  }

  async geocode(query: string): Promise<GeocodeResult[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/geocode/search?api_key=${this.apiKey}&text=${encodeURIComponent(query)}`
      )
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      return data.features?.map((feature: any) => ({
        lat: feature.geometry.coordinates[1],
        lon: feature.geometry.coordinates[0],
        name: feature.properties.label,
        address: feature.properties.label,
      })) || []
    } catch (error) {
      console.error('ORS geocoding error:', error)
      return []
    }
  }

  async travelTime(
    from: { lat: number; lon: number },
    to: { lat: number; lon: number },
    mode: 'drive' | 'walk' | 'transit',
    departISO?: string
  ): Promise<TravelTimeResult> {
    try {
      const profile = this.getProfile(mode)
      const coordinates = [[from.lon, from.lat], [to.lon, to.lat]]
      
      const response = await fetch(
        `${this.baseUrl}/directions/${profile}/json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.apiKey,
          },
          body: JSON.stringify({
            coordinates,
            format: 'json',
            options: {
              avoid_features: mode === 'drive' && process.env.AVOID_HIGHWAYS === 'true' ? ['highways'] : [],
            },
            ...(departISO && { departure_time: departISO }),
          }),
        }
      )
      
      if (!response.ok) {
        throw new Error(`Routing failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.features || data.features.length === 0) {
        throw new Error('No route found')
      }
      
      const route = data.features[0]
      const duration = route.properties.summary.duration / 60 // Convert to minutes
      
      return {
        minutes: Math.round(duration),
        notes: this.getModeNotes(mode),
      }
    } catch (error) {
      console.error('ORS routing error:', error)
      
      // Fallback: estimate based on straight-line distance
      const distance = this.calculateDistance(from, to)
      const estimatedMinutes = this.estimateTravelTime(distance, mode)
      
      return {
        minutes: estimatedMinutes,
        notes: `Estimated (API unavailable): ${this.getModeNotes(mode)}`,
      }
    }
  }

  async routePolyline(
    from: { lat: number; lon: number },
    to: { lat: number; lon: number },
    mode: 'drive' | 'walk' | 'transit',
    departISO?: string
  ): Promise<string> {
    try {
      const profile = this.getProfile(mode)
      const coordinates = [[from.lon, from.lat], [to.lon, to.lat]]
      
      const response = await fetch(
        `${this.baseUrl}/directions/${profile}/json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.apiKey,
          },
          body: JSON.stringify({
            coordinates,
            format: 'json',
            options: {
              avoid_features: mode === 'drive' && process.env.AVOID_HIGHWAYS === 'true' ? ['highways'] : [],
            },
            ...(departISO && { departure_time: departISO }),
          }),
        }
      )
      
      if (!response.ok) {
        throw new Error(`Routing failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.features || data.features.length === 0) {
        throw new Error('No route found')
      }
      
      return data.features[0].geometry.coordinates
        .map((coord: number[]) => [coord[1], coord[0]]) // Convert to [lat, lon]
        .reduce((acc: string, coord: number[], index: number) => {
          return acc + (index === 0 ? '' : ',') + coord.join(',')
        }, '')
    } catch (error) {
      console.error('ORS polyline error:', error)
      return ''
    }
  }

  private getProfile(mode: 'drive' | 'walk' | 'transit'): string {
    switch (mode) {
      case 'drive':
        return 'driving-car'
      case 'walk':
        return 'foot-walking'
      case 'transit':
        return 'driving-car' // Fallback to driving for transit
      default:
        return 'driving-car'
    }
  }

  private getModeNotes(mode: 'drive' | 'walk' | 'transit'): string {
    switch (mode) {
      case 'drive':
        return 'Driving route'
      case 'walk':
        return 'Walking route'
      case 'transit':
        return 'Transit route (approximated)'
      default:
        return 'Unknown mode'
    }
  }

  private calculateDistance(
    from: { lat: number; lon: number },
    to: { lat: number; lon: number }
  ): number {
    const R = 6371 // Earth's radius in km
    const dLat = (to.lat - from.lat) * Math.PI / 180
    const dLon = (to.lon - from.lon) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private estimateTravelTime(distanceKm: number, mode: 'drive' | 'walk' | 'transit'): number {
    const speeds = {
      drive: 30, // km/h in city
      walk: 5,   // km/h
      transit: 20, // km/h average
    }
    
    return Math.round((distanceKm / speeds[mode]) * 60)
  }
}
