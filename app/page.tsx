'use client'

import { useState } from 'react'
import ChatBox from '../components/ChatBox'
import StopsEditor from '../components/StopsEditor'
import PlanCard from '../components/PlanCard'
import MapView from '../components/MapView'
import PreferenceToggles from '../components/PreferenceToggles'
import TelemetryDemo from '../components/TelemetryDemo'
import PersonalizationPanel from '../components/PersonalizationPanel'
import { Constraint, Plan, PlanWithAlternatives } from '../lib/schema'

export default function Home() {
  const [constraints, setConstraints] = useState<Constraint | null>(null)
  const [plan, setPlan] = useState<PlanWithAlternatives | null>(null)
  const [explanation, setExplanation] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleParseConstraints = async (text: string) => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to parse constraints')
      }
      
      const data = await response.json()
      setConstraints(data.constraints)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse constraints')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGeneratePlan = async () => {
    if (!constraints) return
    
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ constraints }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate plan')
      }
      
      const data = await response.json()
      setPlan(data)
      
      // Generate explanation
      const explainResponse = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: data.plan, constraints }),
      })
      
      if (explainResponse.ok) {
        const explainData = await explainResponse.json()
        setExplanation(explainData.explanation)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Micro-Commute Optimizer
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tell us about your day and we'll optimize your route with AI-powered planning
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column - Input and Controls */}
          <div className="space-y-6">
            <ChatBox
              onParse={handleParseConstraints}
              isLoading={isLoading}
              error={error}
            />
            
            {constraints && (
              <div className="space-y-6">
                <StopsEditor
                  constraints={constraints}
                  onChange={setConstraints}
                />
                
                <PreferenceToggles
                  preferences={constraints.preferences}
                  onChange={(preferences) => 
                    setConstraints({ ...constraints, preferences })
                  }
                />
                
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
                  <button
                    onClick={handleGeneratePlan}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Planning Your Route...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Plan My Day
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {plan && (
              <PlanCard
                plan={plan}
                explanation={explanation}
              />
            )}
            
            {plan && (
              <MapView
                plan={plan.plan}
                constraints={constraints}
              />
            )}
            
            {/* Telemetry Dashboard - Always visible for demo */}
            <TelemetryDemo />
            
            {/* Personalization Panel */}
            <PersonalizationPanel />
          </div>
        </div>
      </div>
    </div>
  )
}
