import { RoutingProvider, GeocodeResult, TravelTimeResult } from '../../types/planner.d.ts'

export class MapboxProvider implements RoutingProvider {
  private accessToken: string
  private baseUrl = 'https://api.mapbox.com'

  constructor() {
    this.accessToken = process.env.MAPBOX_TOKEN || ''
    if (!this.accessToken) {
      throw new Error('MAPBOX_TOKEN environment variable is required')
    }
  }

  async geocode(query: string): Promise<GeocodeResult[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.accessToken}`
      )
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      return data.features?.map((feature: any) => ({
        lat: feature.center[1],
        lon: feature.center[0],
        name: feature.place_name,
        address: feature.place_name,
      })) || []
    } catch (error) {
      console.error('Mapbox geocoding error:', error)
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
      const coordinates = `${from.lon},${from.lat};${to.lon},${to.lat}`
      
      const response = await fetch(
        `${this.baseUrl}/directions/v5/mapbox/${profile}/${coordinates}?access_token=${this.accessToken}&geometries=polyline`
      )
      
      if (!response.ok) {
        throw new Error(`Routing failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No route found')
      }
      
      const route = data.routes[0]
      const duration = route.duration / 60 // Convert to minutes
      
      return {
        minutes: Math.round(duration),
        notes: this.getModeNotes(mode),
      }
    } catch (error) {
      console.error('Mapbox routing error:', error)
      
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
      const coordinates = `${from.lon},${from.lat};${to.lon},${to.lat}`
      
      const response = await fetch(
        `${this.baseUrl}/directions/v5/mapbox/${profile}/${coordinates}?access_token=${this.accessToken}&geometries=polyline`
      )
      
      if (!response.ok) {
        throw new Error(`Routing failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No route found')
      }
      
      return data.routes[0].geometry
    } catch (error) {
      console.error('Mapbox polyline error:', error)
      return ''
    }
  }

  private getProfile(mode: 'drive' | 'walk' | 'transit'): string {
    switch (mode) {
      case 'drive':
        return 'driving'
      case 'walk':
        return 'walking'
      case 'transit':
        return 'driving' // Fallback to driving for transit
      default:
        return 'driving'
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
