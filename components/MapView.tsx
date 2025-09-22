'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Plan, Constraint } from '../lib/schema'
import { createRoutingProvider } from '../lib/routing'
import { geocodingService } from '../lib/geocoding'

// Dynamically import the map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false })

// Leaflet imports will be handled dynamically in useEffect

interface MapViewProps {
  plan: Plan
  constraints: Constraint | null
}

// Function to get coordinates using real geocoding
async function getLocationCoordinates(locationName: string): Promise<[number, number]> {
  try {
    console.log(`Geocoding: ${locationName}`)
    
    // Try the dedicated geocoding service first
    const result = await geocodingService.geocodeWithFallback(locationName)
    console.log(`Geocoding result for ${locationName}:`, result)
    
    const coords: [number, number] = [result.lat, result.lon]
    console.log(`Using coordinates for ${locationName}:`, coords)
    return coords
  } catch (error) {
    console.error('Geocoding error:', error)
    // Fallback to downtown Toronto
    return [43.6532, -79.3832]
  }
}

export default function MapView({ plan, constraints }: MapViewProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([43.6532, -79.3832]) // Toronto default
  const [markers, setMarkers] = useState<Array<{ position: [number, number], name: string, type: string }>>([])
  const [routePoints, setRoutePoints] = useState<Array<[number, number]>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [apiKeyLoaded, setApiKeyLoaded] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Initialize Leaflet only on client side
    const initializeLeaflet = async () => {
      if (typeof window !== 'undefined') {
        const L = (await import('leaflet')).default
        
        // Fix for default markers in react-leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        })
      }
    }
    
    // Load API key from server
    const loadApiKey = async () => {
      try {
        const response = await fetch('/api/config')
        const config = await response.json()
        if (config.mapboxToken) {
          geocodingService.setApiKey(config.mapboxToken)
          console.log('✅ Mapbox API key loaded successfully')
        } else {
          console.warn('⚠️ No Mapbox API key found in server config')
        }
        setApiKeyLoaded(true)
      } catch (error) {
        console.error('Failed to load API key:', error)
        setApiKeyLoaded(true)
      }
    }
    
    // Initialize both Leaflet and API key
    Promise.all([initializeLeaflet(), loadApiKey()])
  }, [])

  useEffect(() => {
    if (!isClient || !apiKeyLoaded) return

    // Generate coordinates using real geocoding
    const generateCoordinates = async () => {
      setIsLoading(true)
      try {
        console.log('MapView - constraints:', constraints)
        console.log('MapView - plan:', plan)
        console.log('MapView - constraints.stops:', constraints?.stops)
        console.log('MapView - plan.legs:', plan?.legs)
        
        const newMarkers: Array<{ position: [number, number], name: string, type: string }> = []
        const newRoutePoints: Array<[number, number]> = []
        
        // Start with origin
        if (constraints?.origin) {
          const originPos = await getLocationCoordinates(constraints.origin.name)
          newMarkers.push({
            position: originPos,
            name: constraints.origin.name,
            type: 'start'
          })
          newRoutePoints.push(originPos)
        }

        // Add stops from constraints (if plan.legs is empty or incomplete)
        if (constraints?.stops && constraints.stops.length > 0) {
          console.log('Adding stops from constraints:', constraints.stops.length)
          for (const [index, stop] of constraints.stops.entries()) {
            console.log(`Processing stop ${index}:`, stop.name)
            const position = await getLocationCoordinates(stop.name)
            console.log(`Got coordinates for ${stop.name}:`, position)
            
            // Always add markers - fallback coordinates are still useful
            newMarkers.push({
              position,
              name: stop.name,
              type: index === constraints.stops.length - 1 ? 'end' : 'stop'
            })
            newRoutePoints.push(position)
          }
        }

        // Add stops from plan.legs (if available)
        if (plan.legs && plan.legs.length > 0) {
          console.log('Adding stops from plan.legs:', plan.legs.length)
          for (const [index, leg] of plan.legs.entries()) {
            console.log(`Processing leg ${index}:`, leg.to.name)
            const position = await getLocationCoordinates(leg.to.name)
            console.log(`Got coordinates for ${leg.to.name}:`, position)
            
            // Check if this location is already added
            const existingMarker = newMarkers.find(marker => marker.name === leg.to.name)
            if (!existingMarker) {
              newMarkers.push({
                position,
                name: leg.to.name,
                type: index === plan.legs.length - 1 ? 'end' : 'stop'
              })
              newRoutePoints.push(position)
            }
          }
        }

        console.log('Final markers:', newMarkers)
        console.log('Final route points:', newRoutePoints)
        
        setMarkers(newMarkers)
        setRoutePoints(newRoutePoints)
        
        // Center map on the route
        if (newRoutePoints.length > 0) {
          const avgLat = newRoutePoints.reduce((sum, point) => sum + point[0], 0) / newRoutePoints.length
          const avgLon = newRoutePoints.reduce((sum, point) => sum + point[1], 0) / newRoutePoints.length
          setMapCenter([avgLat, avgLon])
        }
      } catch (error) {
        console.error('Error generating coordinates:', error)
      } finally {
        setIsLoading(false)
      }
    }

    generateCoordinates()
  }, [plan, constraints, isClient, apiKeyLoaded])

  if (!isClient || !apiKeyLoaded) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">Route Map</h3>
        </div>
        <div className="w-full h-80 rounded-xl overflow-hidden relative border-2 border-gray-200/50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <div className="text-lg font-medium text-gray-700">Loading map...</div>
            <div className="text-sm text-gray-500 mt-1">Initializing geocoding service</div>
          </div>
        </div>
      </div>
    )
  }

  if (!constraints?.origin && !constraints?.stops?.length && !plan.legs?.length) {
    return null
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800">Route Map</h3>
      </div>
      
      <div className="w-full h-80 rounded-xl overflow-hidden relative border-2 border-gray-200/50">
        {isLoading ? (
          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <div className="text-lg font-medium text-gray-700">Loading map...</div>
              <div className="text-sm text-gray-500 mt-1">Finding your locations</div>
            </div>
          </div>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Route line */}
            {routePoints.length > 1 && (
              <Polyline
                positions={routePoints}
                color="blue"
                weight={4}
                opacity={0.7}
              />
            )}
            
            {/* Markers */}
            {markers.map((marker, index) => {
              console.log(`Rendering marker ${index}:`, marker.name, marker.position)
              return (
                <Marker key={`${marker.name}-${index}`} position={marker.position}>
                  <Popup>
                    <div className="text-center">
                      <div className="font-semibold">{marker.name}</div>
                      <div className="text-sm text-gray-600">
                        {marker.type === 'start' && '🚀 Start'}
                        {marker.type === 'end' && '🏁 End'}
                        {marker.type === 'stop' && '📍 Stop'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {marker.position[0].toFixed(4)}, {marker.position[1].toFixed(4)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        )}
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="text-sm text-gray-600">
          <strong>Markers Found:</strong> {markers.length}
        </div>
        <div className="text-sm text-gray-600">
          <strong>Start:</strong> {constraints?.origin?.name || plan.legs[0]?.from.name || 'Unknown'}
        </div>
        <div className="text-sm text-gray-600">
          <strong>End:</strong> {constraints?.stops?.[constraints.stops.length - 1]?.name || plan.legs[plan.legs.length - 1]?.to.name || 'Unknown'}
        </div>
        <div className="text-sm text-gray-600">
          <strong>Total Stops:</strong> {constraints?.stops?.length || plan.legs?.length || 0}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Note: This map uses geocoding for precise locations. Check console for debugging info.
        </div>
      </div>
    </div>
  )
}
