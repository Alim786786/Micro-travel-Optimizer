'use client'

import { useEffect, useRef } from 'react'
import { Plan, Constraint } from '../lib/schema'

interface MapViewProps {
  plan: Plan
  constraints: Constraint | null
}

export default function MapView({ plan, constraints }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapRef.current || !plan.legs.length) return

    // Simple map visualization without external dependencies
    // In a real implementation, you would use Mapbox GL JS or similar
    const mapElement = mapRef.current
    mapElement.innerHTML = `
      <div class="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
        <div class="text-center">
          <div class="text-4xl mb-2">🗺️</div>
          <div class="text-gray-600">Map View</div>
          <div class="text-sm text-gray-500 mt-1">
            ${plan.legs.length} stops • ${Math.round(plan.total_minutes / 60 * 10) / 10}h total
          </div>
        </div>
      </div>
    `
  }, [plan])

  if (!plan.legs.length) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="font-semibold mb-4">Route Map</h3>
      <div ref={mapRef} className="w-full h-64" />
      
      <div className="mt-4 space-y-2">
        <div className="text-sm text-gray-600">
          <strong>Start:</strong> {plan.legs[0]?.from.name}
        </div>
        <div className="text-sm text-gray-600">
          <strong>End:</strong> {plan.legs[plan.legs.length - 1]?.to.name}
        </div>
        <div className="text-sm text-gray-600">
          <strong>Total Distance:</strong> ~{Math.round(plan.total_minutes * 0.5)} km (estimated)
        </div>
      </div>
    </div>
  )
}
