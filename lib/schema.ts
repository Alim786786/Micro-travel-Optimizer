import { z } from 'zod'

// Base types
export const StopRef = z.object({
  name: z.string(),
  lat: z.number().nullable().optional(),
  lon: z.number().nullable().optional(),
  address: z.string().nullable().optional(),
})

export const Stop = StopRef.extend({
  by: z.enum(['transit', 'drive', 'walk']).nullable().optional(),
  arrive_window: z.tuple([z.string(), z.string()]).nullable().optional(),
  service_min: z.number().nullable().optional(),
  priority: z.enum([1, 2, 3]).nullable().optional(),
})

export const Preferences = z.object({
  modePriority: z.array(z.enum(['transit', 'drive', 'walk'])).optional(),
  minimizeTransfers: z.boolean().nullable().optional(),
  minimizeCost: z.boolean().nullable().optional(),
  avoidHighways: z.boolean().nullable().optional(),
})

export const Constraint = z.object({
  origin: StopRef.nullable().optional(),
  start_after: z.string().nullable().optional(), // "HH:MM"
  must_end_by: z.string().nullable().optional(), // "HH:MM"
  stops: z.array(Stop),
  preferences: Preferences.optional(),
})

export const Leg = z.object({
  from: StopRef,
  to: StopRef,
  mode: z.enum(['transit', 'drive', 'walk']),
  depart_time: z.string(),
  arrive_time: z.string(),
  minutes: z.number(),
  notes: z.string().optional(),
})

export const Plan = z.object({
  legs: z.array(Leg),
  total_minutes: z.number(),
  feasibility_notes: z.array(z.string()).optional(),
})

export const PlanWithAlternatives = z.object({
  plan: Plan,
  alternatives: z.object({
    faster: Plan.optional(),
    cheaper: Plan.optional(),
  }),
  feasibility_notes: z.array(z.string()).optional(),
})

// Type exports
export type StopRef = z.infer<typeof StopRef>
export type Stop = z.infer<typeof Stop>
export type Preferences = z.infer<typeof Preferences>
export type Constraint = z.infer<typeof Constraint>
export type Leg = z.infer<typeof Leg>
export type Plan = z.infer<typeof Plan>
export type PlanWithAlternatives = z.infer<typeof PlanWithAlternatives>

// Utility functions
export function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

export function addMinutes(timeStr: string, minutes: number): string {
  const totalMinutes = parseTime(timeStr) + minutes
  return formatTime(totalMinutes)
}
