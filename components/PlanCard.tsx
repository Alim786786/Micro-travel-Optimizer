'use client'

import { PlanWithAlternatives, Leg } from '../lib/schema'
import { formatTime, parseTime } from '../lib/schema'
import { appendTelemetry } from '../lib/personalization/store'
import { getPrimaryMode, getTotalDistanceMeters } from '../lib/personalization/utils'

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

  const handleUsePlan = () => {
    try {
      const primaryMode = getPrimaryMode(plan.plan)
      const totalDistance = getTotalDistanceMeters(plan.plan)
      
      appendTelemetry({
        ts: Date.now(),
        event: "plan_chosen",
        chosen_mode: primaryMode,
        distance_m: totalDistance,
        context: {
          total_minutes: plan.plan.total_minutes,
          leg_count: plan.plan.legs.length,
          has_alternatives: !!(plan.alternatives.faster || plan.alternatives.cheaper)
        }
      })
      
      console.log('Plan selected and telemetry recorded')
    } catch (error) {
      console.warn('Failed to record plan selection telemetry:', error)
    }
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
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Your Optimized Plan</h2>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {formatDuration(plan.plan.total_minutes)}
            </div>
            <div className="text-sm font-medium text-gray-500">Total Time</div>
          </div>
        </div>

        {plan.plan.feasibility_notes && (
          <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 text-amber-800 rounded-xl">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="font-semibold">Important Notes:</div>
            </div>
            <ul className="list-disc list-inside text-sm space-y-1">
              {plan.plan.feasibility_notes.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          {plan.plan.legs.map((leg, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 bg-white/60 backdrop-blur-sm border-2 border-gray-200/50 rounded-xl hover:border-blue-300/50 transition-all duration-200">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">{getModeIcon(leg.mode)}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-1">
                  <span className="font-semibold text-gray-800">{leg.from.name}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span className="font-semibold text-gray-800">{leg.to.name}</span>
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">{leg.depart_time}</span> - <span className="font-medium">{leg.arrive_time}</span>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {formatDuration(leg.minutes)}
                  </span>
                </div>
                {leg.notes && (
                  <div className="text-xs text-gray-500 italic">{leg.notes}</div>
                )}
              </div>
              <div className="flex-shrink-0">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getModeColor(leg.mode)}`}>
                  {leg.mode}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Use This Plan Button */}
        <div className="mt-6 pt-6 border-t border-gray-200/50">
          <button
            onClick={handleUsePlan}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-emerald-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Use This Plan
            </div>
          </button>
        </div>
      </div>

      {/* Alternatives */}
      {(plan.alternatives.faster || plan.alternatives.cheaper) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plan.alternatives.faster && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-green-600">⚡ Faster Alternative</h3>
              </div>
              <div className="text-lg font-bold text-green-600 mb-4">
                {formatDuration(plan.alternatives.faster.total_minutes)} total
              </div>
              <div className="space-y-3">
                {plan.alternatives.faster.legs.slice(0, 3).map((leg, index) => (
                  <div key={index} className="flex items-center space-x-3 text-sm">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">{getModeIcon(leg.mode)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{leg.from.name} → {leg.to.name}</div>
                      <div className="text-xs text-gray-500">{formatDuration(leg.minutes)}</div>
                    </div>
                  </div>
                ))}
                {plan.alternatives.faster.legs.length > 3 && (
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block">
                    +{plan.alternatives.faster.legs.length - 3} more stops
                  </div>
                )}
              </div>
            </div>
          )}

          {plan.alternatives.cheaper && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-blue-600">💰 Cheaper Alternative</h3>
              </div>
              <div className="text-lg font-bold text-blue-600 mb-4">
                {formatDuration(plan.alternatives.cheaper.total_minutes)} total
              </div>
              <div className="space-y-3">
                {plan.alternatives.cheaper.legs.slice(0, 3).map((leg, index) => (
                  <div key={index} className="flex items-center space-x-3 text-sm">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">{getModeIcon(leg.mode)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{leg.from.name} → {leg.to.name}</div>
                      <div className="text-xs text-gray-500">{formatDuration(leg.minutes)}</div>
                    </div>
                  </div>
                ))}
                {plan.alternatives.cheaper.legs.length > 3 && (
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block">
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
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Plan Summary</h3>
          </div>
          <div className="prose prose-lg max-w-none">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-gray-200/50">
              <div className="text-gray-800 leading-relaxed font-medium whitespace-pre-wrap text-base">
                {explanation}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
