'use client'

import { Preferences } from '../lib/schema'

interface PreferenceTogglesProps {
  preferences?: Preferences
  onChange: (preferences: Preferences) => void
}

export default function PreferenceToggles({ preferences, onChange }: PreferenceTogglesProps) {
  const updatePreference = (field: keyof Preferences, value: any) => {
    onChange({
      ...preferences,
      [field]: value,
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Preferences</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mode Priority
          </label>
          <div className="space-y-2">
            {['transit', 'drive', 'walk'].map((mode) => (
              <label key={mode} className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences?.modePriority?.includes(mode as any) || false}
                  onChange={(e) => {
                    const current = preferences?.modePriority || []
                    if (e.target.checked) {
                      updatePreference('modePriority', [...current, mode])
                    } else {
                      updatePreference('modePriority', current.filter(m => m !== mode))
                    }
                  }}
                  className="mr-2"
                />
                <span className="capitalize">{mode}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences?.minimizeTransfers || false}
              onChange={(e) => updatePreference('minimizeTransfers', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Minimize Transfers</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences?.minimizeCost || false}
              onChange={(e) => updatePreference('minimizeCost', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Minimize Cost</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences?.avoidHighways || false}
              onChange={(e) => updatePreference('avoidHighways', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Avoid Highways</span>
          </label>
        </div>
      </div>
    </div>
  )
}
