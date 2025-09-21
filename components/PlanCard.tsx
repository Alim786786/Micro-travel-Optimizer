'use client'

import { PlanWithAlternatives, Leg } from '../lib/schema'
import { formatTime, parseTime } from '../lib/schema'

interface PlanCardProps {
  plan: PlanWithAlternatives
  explanation: string
}

export default function PlanCard({ plan, explanation }: PlanCardProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'transit': return '🚌'
      case 'drive': return '🚗'
      case 'walk': return '🚶'
      default: return '📍'
    }
  }

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'transit': return 'bg-blue-100 text-blue-800'
      case 'drive': return 'bg-green-100 text-green-800'
      case 'walk': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Main Plan */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">Your Optimized Plan</h2>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {formatDuration(plan.plan.total_minutes)}
            </div>
            <div className="text-sm text-gray-500">Total Time</div>
          </div>
        </div>

        {plan.plan.feasibility_notes && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            <div className="font-medium">Notes:</div>
            <ul className="list-disc list-inside text-sm">
              {plan.plan.feasibility_notes.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-3">
          {plan.plan.legs.map((leg, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <span className="text-2xl">{getModeIcon(leg.mode)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{leg.from.name}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{leg.to.name}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {leg.depart_time} - {leg.arrive_time} ({formatDuration(leg.minutes)})
                </div>
                {leg.notes && (
                  <div className="text-xs text-gray-500">{leg.notes}</div>
                )}
              </div>
              <div className="flex-shrink-0">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getModeColor(leg.mode)}`}>
                  {leg.mode}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alternatives */}
      {(plan.alternatives.faster || plan.alternatives.cheaper) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plan.alternatives.faster && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold text-green-600 mb-2">⚡ Faster Alternative</h3>
              <div className="text-sm text-gray-600 mb-2">
                {formatDuration(plan.alternatives.faster.total_minutes)} total
              </div>
              <div className="space-y-2">
                {plan.alternatives.faster.legs.slice(0, 3).map((leg, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <span>{getModeIcon(leg.mode)}</span>
                    <span>{leg.from.name} → {leg.to.name}</span>
                    <span className="text-gray-500">({formatDuration(leg.minutes)})</span>
                  </div>
                ))}
                {plan.alternatives.faster.legs.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{plan.alternatives.faster.legs.length - 3} more stops
                  </div>
                )}
              </div>
            </div>
          )}

          {plan.alternatives.cheaper && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold text-blue-600 mb-2">💰 Cheaper Alternative</h3>
              <div className="text-sm text-gray-600 mb-2">
                {formatDuration(plan.alternatives.cheaper.total_minutes)} total
              </div>
              <div className="space-y-2">
                {plan.alternatives.cheaper.legs.slice(0, 3).map((leg, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <span>{getModeIcon(leg.mode)}</span>
                    <span>{leg.from.name} → {leg.to.name}</span>
                    <span className="text-gray-500">({formatDuration(leg.minutes)})</span>
                  </div>
                ))}
                {plan.alternatives.cheaper.legs.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{plan.alternatives.cheaper.legs.length - 3} more stops
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Explanation */}
      {explanation && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold mb-3">Plan Summary</h3>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-gray-700">
              {explanation}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
