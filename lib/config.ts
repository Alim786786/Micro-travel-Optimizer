/**
 * Feature flags and configuration for the application
 */

export const PERSONALIZATION_ENABLED = true

export const TELEMETRY_ENABLED = true

export const DEBUG_MODE = process.env.NODE_ENV === 'development'
