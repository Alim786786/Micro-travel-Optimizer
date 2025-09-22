import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    mapboxToken: process.env.MAPBOX_TOKEN || '',
    orsApiKey: process.env.ORS_API_KEY || '',
    routingProvider: process.env.ROUTING_PROVIDER || 'ors'
  })
}

