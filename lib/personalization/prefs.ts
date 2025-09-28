const SHORT_WALK_PREF_KEY = 'mc.pref.shortwalk'

/**
 * Get the user's preference for walking on short trips (<2km)
 * @returns true if user prefers walking for short trips, false otherwise
 */
export function getShortWalkPreference(): boolean {
  try {
    if (typeof window === 'undefined') {
      return false
    }
    const stored = localStorage.getItem(SHORT_WALK_PREF_KEY)
    return stored === 'true'
  } catch (error) {
    console.warn('Failed to get short walk preference:', error)
    return false
  }
}

/**
 * Set the user's preference for walking on short trips (<2km)
 * @param value - true to prefer walking for short trips, false otherwise
 */
export function setShortWalkPreference(value: boolean): void {
  try {
    if (typeof window === 'undefined') {
      return
    }
    localStorage.setItem(SHORT_WALK_PREF_KEY, value.toString())
  } catch (error) {
    console.warn('Failed to set short walk preference:', error)
  }
}
