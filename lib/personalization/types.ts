export type TravelMode = "walk" | "transit" | "drive"

export interface TelemetryEvent {
  ts: number                   // epoch ms
  event: "plan_chosen" | "mode_overridden" | "stop_reordered"
  distance_m?: number          // optional
  chosen_mode?: TravelMode     // optional
  context?: Record<string, any>
}

export interface PrefStats {
  totals: Record<TravelMode, number>      // total selections
  byDistanceKm: {
    lt1: Record<TravelMode, number>
    lt2: Record<TravelMode, number>
    lt5: Record<TravelMode, number>
    gte5: Record<TravelMode, number>
  }
  lastUpdated: number
}
