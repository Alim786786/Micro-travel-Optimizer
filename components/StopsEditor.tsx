'use client'

import { Constraint, Stop } from '../lib/schema'

interface StopsEditorProps {
  constraints: Constraint
  onChange: (constraints: Constraint) => void
}

export default function StopsEditor({ constraints, onChange }: StopsEditorProps) {
  const updateStop = (index: number, field: keyof Stop, value: any) => {
    const newStops = [...constraints.stops]
    newStops[index] = { ...newStops[index], [field]: value }
    onChange({ ...constraints, stops: newStops })
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Stops</h2>
        <button
          onClick={addStop}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700"
        >
          Add Stop
        </button>
      </div>
      
      <div className="space-y-4">
        {constraints.stops.map((stop, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-medium">Stop {index + 1}</h3>
              <button
                onClick={() => removeStop(index)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={stop.name}
                  onChange={(e) => updateStop(index, 'name', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mode
                </label>
                <select
                  value={stop.by || ''}
                  onChange={(e) => updateStop(index, 'by', e.target.value || null)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any</option>
                  <option value="transit">Transit</option>
                  <option value="drive">Drive</option>
                  <option value="walk">Walk</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Time (min)
                </label>
                <input
                  type="number"
                  value={stop.service_min || 10}
                  onChange={(e) => updateStop(index, 'service_min', parseInt(e.target.value) || 10)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={stop.priority || 2}
                  onChange={(e) => updateStop(index, 'priority', parseInt(e.target.value) as 1 | 2 | 3)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={1}>High</option>
                  <option value={2}>Medium</option>
                  <option value={3}>Low</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Arrival Window (optional)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="time"
                    value={stop.arrive_window?.[0] || ''}
                    onChange={(e) => {
                      const window = stop.arrive_window || ['', '']
                      window[0] = e.target.value
                      updateStop(index, 'arrive_window', window[0] && window[1] ? window : null)
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Start time"
                  />
                  <span className="flex items-center">to</span>
                  <input
                    type="time"
                    value={stop.arrive_window?.[1] || ''}
                    onChange={(e) => {
                      const window = stop.arrive_window || ['', '']
                      window[1] = e.target.value
                      updateStop(index, 'arrive_window', window[0] && window[1] ? window : null)
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="End time"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
