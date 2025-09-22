// Geocoding service using Mapbox API
export interface GeocodeResult {
  lat: number
  lon: number
  name: string
  address?: string
}

export class GeocodingService {
  private apiKey: string
  private baseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey
  }

  async geocode(query: string): Promise<GeocodeResult[]> {
    // If no API key, use fallback immediately
    if (!this.apiKey) {
      console.warn('No Mapbox API key found, using fallback coordinates')
      return [this.getFallbackCoordinates(query)]
    }

    try {
      const encodedQuery = encodeURIComponent(query)
      const url = `${this.baseUrl}/${encodedQuery}.json?access_token=${this.apiKey}&limit=5`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      return data.features.map((feature: any) => ({
        lat: feature.center[1],
        lon: feature.center[0],
        name: feature.place_name,
        address: feature.place_name
      }))
    } catch (error) {
      console.error('Geocoding error:', error)
      // Return fallback coordinates
      return [this.getFallbackCoordinates(query)]
    }
  }

  async geocodeWithFallback(query: string): Promise<GeocodeResult> {
    const results = await this.geocode(query)
    if (results.length > 0) {
      return results[0]
    }
    
    // Fallback to approximate coordinates
    return this.getFallbackCoordinates(query)
  }

  private getFallbackCoordinates(query: string): GeocodeResult {
    const name = query.toLowerCase()
    
    // Toronto landmarks and areas with more specific coordinates
    const locations: { [key: string]: GeocodeResult } = {
      // Downtown Toronto - Yonge Street area
      '285 yonge': { lat: 43.6532, lon: -79.3832, name: query, address: query },
      'yonge st': { lat: 43.6532, lon: -79.3832, name: query, address: query },
      'yonge street': { lat: 43.6532, lon: -79.3832, name: query, address: query },
      'downtown': { lat: 43.6532, lon: -79.3832, name: query, address: query },
      
      // Schools - Jarvis Collegiate area
      'jarvis collegiate': { lat: 43.6588, lon: -79.3756, name: query, address: query },
      'jarvis': { lat: 43.6588, lon: -79.3756, name: query, address: query },
      
      // Grocery stores - different areas
      'no frills': { lat: 43.6512, lon: -79.3689, name: query, address: query },
      'loblaws': { lat: 43.6512, lon: -79.3689, name: query, address: query },
      'metro': { lat: 43.6512, lon: -79.3689, name: query, address: query },
      
      // East Toronto areas - Donlands/Danforth
      'donlands': { lat: 43.6789, lon: -79.3456, name: query, address: query },
      'east york': { lat: 43.6789, lon: -79.3456, name: query, address: query },
      'danforth': { lat: 43.6789, lon: -79.3456, name: query, address: query },
      
      // Major streets with different coordinates
      'bloor': { lat: 43.6677, lon: -79.4000, name: query, address: query },
      'queen': { lat: 43.6532, lon: -79.3832, name: query, address: query },
      'king': { lat: 43.6532, lon: -79.3832, name: query, address: query },
      'dundas': { lat: 43.6532, lon: -79.3832, name: query, address: query },
      'college': { lat: 43.6532, lon: -79.3832, name: query, address: query },
      'university': { lat: 43.6532, lon: -79.3832, name: query, address: query },
      
      // Home locations
      'home': { lat: 43.6789, lon: -79.3456, name: query, address: query },
    }
    
    // Try to find a match
    for (const [key, coords] of Object.entries(locations)) {
      if (name.includes(key)) {
        console.log(`Using fallback coordinates for "${query}": ${coords.lat}, ${coords.lon}`)
        return coords
      }
    }
    
    // Default to downtown Toronto if no match found
    console.log(`No specific fallback found for "${query}", using downtown Toronto`)
    return { lat: 43.6532, lon: -79.3832, name: query, address: query }
  }
}

// Create a singleton instance that gets the API key at runtime
export const geocodingService = new GeocodingService('')
