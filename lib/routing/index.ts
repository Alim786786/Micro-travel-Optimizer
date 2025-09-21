import { RoutingProvider, GeocodeResult, TravelTimeResult } from '../../types/planner'
import { OpenRouteServiceProvider } from './ors'
import { MapboxProvider } from './mapbox'

export { RoutingProvider, GeocodeResult, TravelTimeResult }

export function createRoutingProvider(): RoutingProvider {
  const provider = process.env.ROUTING_PROVIDER || 'ors'
  
  if (provider === 'ors') {
    return new OpenRouteServiceProvider()
  } else if (provider === 'mapbox') {
    return new MapboxProvider()
  } else {
    throw new Error(`Unsupported routing provider: ${provider}`)
  }
}
