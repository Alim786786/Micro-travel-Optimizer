'use client'

import { useState, useEffect } from 'react'
import { getPrefStats, clearPersonalization } from '../lib/personalization/store'
import { PrefStats } from '../lib/personalization/types'
import { getShortWalkPreference, setShortWalkPreference } from '../lib/personalization/prefs'

export default function PersonalizationPanel() {
  const [stats, setStats] = useState<PrefStats | null>(null)
  const [isClearing, setIsClearing] = useState(false)
  const [shortWalkPreference, setShortWalkPreferenceState] = useState(false)

  const refreshStats = () => {
    setStats(getPrefStats())
  }

  useEffect(() => {
    refreshStats()
    setShortWalkPreferenceState(getShortWalkPreference())
  }, [])

  const handleClearData = async () => {
    setIsClearing(true)
    try {
      clearPersonalization()
      refreshStats()
    } catch (error) {
      console.error('Failed to clear personalization data:', error)
    } finally {
      setIsClearing(false)
    }
  }

  const handleShortWalkToggle = (checked: boolean) => {
    setShortWalkPreference(checked)
    setShortWalkPreferenceState(checked)
  }

  if (!stats) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Personalization</h2>
        <p className="text-gray-500">Loading personalization data...</p>
      </div>
    )
  }

  const totalSelections = stats.totals.walk + stats.totals.transit + stats.totals.drive
  const hasData = totalSelections > 0

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Personalization</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${hasData ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600">
            {hasData ? 'Active' : 'No data'}
          </span>
        </div>
      </div>

      {!hasData ? (
        <div className="space-y-6">
          {/* Short Walk Preference Toggle - Always visible */}
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-1">
                  Prefer walking for short trips (&lt; 2km)
                </h3>
                <p className="text-sm text-blue-600">
                  Automatically bias route planning toward walking for distances under 2 kilometers
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={shortWalkPreference}
                  onChange={(e) => handleShortWalkToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Personalization Data</h3>
            <p className="text-gray-600 mb-4">
              Start using the app to generate plans and we'll learn your preferences over time.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Short Walk Preference Toggle */}
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-1">
                  Prefer walking for short trips (&lt; 2km)
                </h3>
                <p className="text-sm text-blue-600">
                  Automatically bias route planning toward walking for distances under 2 kilometers
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={shortWalkPreference}
                  onChange={(e) => handleShortWalkToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Total Selections */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Total Selections</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">{stats.totals.walk}</div>
                <div className="text-sm text-orange-700">Walking</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{stats.totals.transit}</div>
                <div className="text-sm text-blue-700">Transit</div>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <div className="text-2xl font-bold text-green-600">{stats.totals.drive}</div>
                <div className="text-sm text-green-700">Driving</div>
              </div>
            </div>
          </div>

          {/* Distance Buckets */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Preferences by Distance</h3>
            <div className="space-y-3">
              {Object.entries(stats.byDistanceKm).map(([bucket, modes]) => {
                const bucketTotal = modes.walk + modes.transit + modes.drive
                if (bucketTotal === 0) return null

                return (
                  <div key={bucket} className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-800">
                        {bucket === 'lt1' ? '< 1km' : 
                         bucket === 'lt2' ? '1-2km' :
                         bucket === 'lt5' ? '2-5km' : '5km+'}
                      </span>
                      <span className="text-sm text-gray-600">{bucketTotal} selections</span>
                    </div>
                    <div className="flex space-x-2">
                      {modes.walk > 0 && (
                        <div className="flex-1 bg-orange-100 rounded-lg p-2 text-center">
                          <div className="text-sm font-medium text-orange-800">{modes.walk}</div>
                          <div className="text-xs text-orange-600">Walk</div>
                        </div>
                      )}
                      {modes.transit > 0 && (
                        <div className="flex-1 bg-blue-100 rounded-lg p-2 text-center">
                          <div className="text-sm font-medium text-blue-800">{modes.transit}</div>
                          <div className="text-xs text-blue-600">Transit</div>
                        </div>
                      )}
                      {modes.drive > 0 && (
                        <div className="flex-1 bg-green-100 rounded-lg p-2 text-center">
                          <div className="text-sm font-medium text-green-800">{modes.drive}</div>
                          <div className="text-xs text-green-600">Drive</div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-gray-500 text-center">
            Last updated: {new Date(stats.lastUpdated).toLocaleString()}
          </div>
        </div>
      )}

      {/* Clear Data Button */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-medium text-gray-800">Reset Personalization</h4>
            <p className="text-sm text-gray-600">
              Clear all collected preference data and start fresh
            </p>
          </div>
          <button
            onClick={handleClearData}
            disabled={!hasData || isClearing}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isClearing ? 'Clearing...' : 'Clear Data'}
          </button>
        </div>
      </div>
    </div>
  )
}
