'use client'

import { Constraint, Stop } from '../lib/schema'
import { appendTelemetry } from '../lib/personalization/store'

interface StopsEditorProps {
  constraints: Constraint
  onChange: (constraints: Constraint) => void
}

export default function StopsEditor({ constraints, onChange }: StopsEditorProps) {
  const updateStop = (index: number, field: keyof Stop, value: any) => {
    const oldStop = constraints.stops[index]
    const newStops = [...constraints.stops]
    newStops[index] = { ...newStops[index], [field]: value }
    onChange({ ...constraints, stops: newStops })
    
    // Record telemetry for mode overrides
    if (field === 'by' && value && value !== oldStop.by) {
      try {
        appendTelemetry({
          ts: Date.now(),
          event: "mode_overridden",
          chosen_mode: value as any,
          context: {
            stop_name: newStops[index].name || `Stop ${index + 1}`,
            stop_index: index,
            previous_mode: oldStop.by
          }
        })
      } catch (error) {
        console.warn('Failed to record mode override telemetry:', error)
      }
    }
  }

  const formatTimeForDisplay = (timeStr: string): string => {
    if (!timeStr) return ''
    
    // If it's already in 12-hour format, return as is
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      return timeStr
    }
    
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = timeStr.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  const addStop = () => {
    const newStop: Stop = {
      name: '',
      lat: null,
      lon: null,
      address: null,
      by: null,
      arrive_window: null,
      service_min: 10,
      priority: 2,
    }
    onChange({ ...constraints, stops: [...constraints.stops, newStop] })
  }

  const removeStop = (index: number) => {
    const newStops = constraints.stops.filter((_, i) => i !== index)
    onChange({ ...constraints, stops: newStops })
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Stops</h2>
        </div>
        <button
          onClick={addStop}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Stop
          </div>
        </button>
      </div>
      
      <div className="space-y-6">
        {constraints.stops.map((stop, index) => (
          <div key={index} className="bg-white/60 backdrop-blur-sm border-2 border-gray-200/50 rounded-xl p-6 hover:border-blue-300/50 transition-all duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">{index + 1}</span>
                </div>
                <h3 className="font-semibold text-gray-800">Stop {index + 1}</h3>
              </div>
              <button
                onClick={() => removeStop(index)}
                className="text-red-500 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-3 py-1 rounded-lg transition-all duration-200"
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove
                </div>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location Name
                </label>
                <input
                  type="text"
                  value={stop.name}
                  onChange={(e) => updateStop(index, 'name', e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="Enter location name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Transportation Mode
                </label>
                <select
                  value={stop.by || ''}
                  onChange={(e) => updateStop(index, 'by', e.target.value || null)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                >
                  <option value="">Any Mode</option>
                  <option value="transit">🚇 Transit</option>
                  <option value="drive">🚗 Drive</option>
                  <option value="walk">🚶 Walk</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Service Time (minutes)
                </label>
                <input
                  type="number"
                  value={stop.service_min || 10}
                  onChange={(e) => updateStop(index, 'service_min', parseInt(e.target.value) || 10)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="10"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Priority Level
                </label>
                <select
                  value={stop.priority || 2}
                  onChange={(e) => updateStop(index, 'priority', parseInt(e.target.value) as 1 | 2 | 3)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                >
                  <option value={1}>🔥 High Priority</option>
                  <option value={2}>⚖️ Medium Priority</option>
                  <option value={3}>📋 Low Priority</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ⏰ Arrival Window (optional)
                </label>
                <div className="flex space-x-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={stop.arrive_window?.[0] ? formatTimeForDisplay(stop.arrive_window[0]) : ''}
                      onChange={(e) => {
                        const currentWindow = stop.arrive_window || ['', '']
                        const newWindow = [e.target.value, currentWindow[1] || '']
                        updateStop(index, 'arrive_window', newWindow)
                      }}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      placeholder="e.g., 2:40 PM"
                    />
                  </div>
                  <div className="flex items-center text-gray-500 font-medium">
                    to
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={stop.arrive_window?.[1] ? formatTimeForDisplay(stop.arrive_window[1]) : ''}
                      onChange={(e) => {
                        const currentWindow = stop.arrive_window || ['', '']
                        const newWindow = [currentWindow[0] || '', e.target.value]
                        updateStop(index, 'arrive_window', newWindow)
                      }}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      placeholder="e.g., 3:25 PM"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Format: 2:40 PM, 3:25 PM, etc.
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
