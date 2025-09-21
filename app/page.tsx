'use client'

import { useState } from 'react'
import ChatBox from '../components/ChatBox'
import StopsEditor from '../components/StopsEditor'
import PlanCard from '../components/PlanCard'
import MapView from '../components/MapView'
import PreferenceToggles from '../components/PreferenceToggles'
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Micro-Commute Optimizer
          </h1>
          <p className="text-lg text-gray-600">
            Tell us about your day and we'll optimize your route
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input and Controls */}
          <div className="space-y-6">
            <ChatBox
              onParse={handleParseConstraints}
              isLoading={isLoading}
              error={error}
            />
            
            {constraints && (
              <StopsEditor
                constraints={constraints}
                onChange={setConstraints}
              />
            )}
            
            {constraints && (
              <PreferenceToggles
                preferences={constraints.preferences}
                onChange={(preferences) => 
                  setConstraints({ ...constraints, preferences })
                }
              />
            )}
            
            {constraints && (
              <button
                onClick={handleGeneratePlan}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Planning...' : 'Plan My Day'}
              </button>
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
          </div>
        </div>
      </div>
    </div>
  )
}
