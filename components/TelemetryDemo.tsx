'use client'

import { useState, useEffect } from 'react'
import { getTelemetry, getPrefStats, clearPersonalization, appendTelemetry } from '../lib/personalization/store'
import { TelemetryEvent, PrefStats } from '../lib/personalization/types'

export default function TelemetryDemo() {
  const [telemetry, setTelemetry] = useState<TelemetryEvent[]>([])
  const [stats, setStats] = useState<PrefStats | null>(null)

  const refreshData = () => {
    setTelemetry(getTelemetry())
    setStats(getPrefStats())
  }

  useEffect(() => {
    refreshData()
  }, [])

  const handleClear = () => {
    clearPersonalization()
    refreshData()
  }

  const handleTestTelemetry = () => {
    try {
      appendTelemetry({
        ts: Date.now(),
        event: "plan_chosen",
        chosen_mode: "transit",
        distance_m: 5000,
        context: { test: true }
      })
      refreshData()
    } catch (error) {
      console.error('Test telemetry failed:', error)
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Telemetry Dashboard</h2>
        <div className="space-x-3">
          <button
            onClick={refreshData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={handleTestTelemetry}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Test
          </button>
          <button
            onClick={handleClear}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Telemetry Events */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Events ({telemetry.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {telemetry.length === 0 ? (
              <p className="text-gray-500 italic">No telemetry data yet</p>
            ) : (
              telemetry.slice(-10).reverse().map((event, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg text-sm">
                  <div className="font-medium">{event.event}</div>
                  <div className="text-gray-600">
                    {event.chosen_mode && `Mode: ${event.chosen_mode}`}
                    {event.distance_m && ` • ${Math.round(event.distance_m / 1000)}km`}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(event.ts).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Preference Stats */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Preference Statistics</h3>
          {stats ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Total Selections</h4>
                <div className="space-y-1">
                  {Object.entries(stats.totals).map(([mode, count]) => (
                    <div key={mode} className="flex justify-between">
                      <span className="capitalize">{mode}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">By Distance</h4>
                <div className="space-y-2">
                  {Object.entries(stats.byDistanceKm).map(([bucket, modes]) => (
                    <div key={bucket} className="bg-gray-50 p-2 rounded">
                      <div className="text-sm font-medium mb-1">{bucket} km</div>
                      <div className="space-y-1">
                        {Object.entries(modes).map(([mode, count]) => (
                          <div key={mode} className="flex justify-between text-xs">
                            <span className="capitalize">{mode}:</span>
                            <span>{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                Last updated: {new Date(stats.lastUpdated).toLocaleString()}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">No statistics available</p>
          )}
        </div>
      </div>
    </div>
  )
}
