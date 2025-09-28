# Personalization Telemetry System

A minimal client-side telemetry layer for learning commute preferences over time using localStorage.

## Features

- **No Backend Required**: All data stored locally in browser localStorage
- **Privacy-First**: No external data transmission
- **Type-Safe**: Full TypeScript support with strict typing
- **Non-Blocking**: Graceful error handling that won't break the UI
- **Automatic Statistics**: Computes preference statistics on-the-fly

## Files Created

### Core Types (`lib/personalization/types.ts`)
- `TravelMode`: Union type for "walk" | "transit" | "drive"
- `TelemetryEvent`: Structure for recording user actions
- `PrefStats`: Computed statistics interface

### Storage Layer (`lib/personalization/store.ts`)
- `getTelemetry()`: Retrieve all telemetry events
- `appendTelemetry(event)`: Add new telemetry event
- `getPrefStats()`: Get computed preference statistics
- `clearPersonalization()`: Clear all stored data

### Utilities (`lib/personalization/utils.ts`)
- `getPrimaryMode(plan)`: Determine primary mode from plan
- `getTotalDistanceMeters(plan)`: Calculate total distance

## Usage

### Recording Plan Selection
```typescript
import { appendTelemetry } from '../lib/personalization/store'
import { getPrimaryMode, getTotalDistanceMeters } from '../lib/personalization/utils'

const handlePlanSelection = (plan: Plan) => {
  appendTelemetry({
    ts: Date.now(),
    event: "plan_chosen",
    chosen_mode: getPrimaryMode(plan),
    distance_m: getTotalDistanceMeters(plan),
    context: { total_minutes: plan.total_minutes }
  })
}
```

### Recording Mode Overrides
```typescript
const handleModeChange = (newMode: TravelMode, stopName: string) => {
  appendTelemetry({
    ts: Date.now(),
    event: "mode_overridden",
    chosen_mode: newMode,
    context: { stop_name: stopName }
  })
}
```

### Getting Statistics
```typescript
import { getPrefStats } from '../lib/personalization/store'

const stats = getPrefStats()
console.log('Total transit selections:', stats.totals.transit)
console.log('Short walks (<1km):', stats.byDistanceKm.lt1.walk)
```

## Data Structure

### Telemetry Events
Events are stored as JSON array in localStorage key `mc.telemetry`:
```json
[
  {
    "ts": 1695678900000,
    "event": "plan_chosen",
    "chosen_mode": "transit",
    "distance_m": 5000,
    "context": { "total_minutes": 45 }
  }
]
```

### Preference Statistics
Computed statistics cached in localStorage key `mc.pref.stats`:
```json
{
  "totals": { "walk": 5, "transit": 12, "drive": 3 },
  "byDistanceKm": {
    "lt1": { "walk": 3, "transit": 1, "drive": 0 },
    "lt2": { "walk": 2, "transit": 4, "drive": 1 },
    "lt5": { "walk": 0, "transit": 5, "drive": 2 },
    "gte5": { "walk": 0, "transit": 2, "drive": 0 }
  },
  "lastUpdated": 1695678900000
}
```

## Distance Buckets
- `lt1`: Less than 1km
- `lt2`: Less than 2km  
- `lt5`: Less than 5km
- `gte5`: 5km or more

## Error Handling
All localStorage operations are wrapped in try-catch blocks:
- Failed reads return empty arrays/default values
- Failed writes log warnings but don't throw
- UI remains functional even if telemetry fails

## Testing
Run tests with:
```bash
npm test lib/personalization
```

Tests cover:
- localStorage error handling
- Statistics computation
- Data persistence
- Utility functions
