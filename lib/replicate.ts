import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function parseConstraints(text: string): Promise<any> {
  // Fallback parser for when Replicate is not available
  console.log('Using fallback parser for:', text)
  
  // Simple regex-based parsing for common patterns
  const constraints: any = {
    origin: null,
    start_after: null,
    must_end_by: null,
    stops: [],
    preferences: {
      modePriority: ['transit', 'drive', 'walk']
    }
  }

  // Extract time patterns
  const timePatterns = [
    /(\d{1,2}):(\d{2})\s*(am|pm)/gi,
    /at\s+(\d{1,2}):(\d{2})/gi,
    /around\s+(\d{1,2}):(\d{2})/gi
  ]

  // Extract location patterns
  const locationPatterns = [
    /from\s+([^,]+?)(?:\s+at|\s+around|$)/gi,
    /at\s+([^,]+?)(?:\s+at|\s+around|$)/gi,
    /pick\s+up.*?at\s+([^,]+?)(?:\s+at|\s+around|$)/gi
  ]

  // Extract start time
  const startMatch = text.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i)
  if (startMatch) {
    let hours = parseInt(startMatch[1])
    const minutes = parseInt(startMatch[2])
    const period = startMatch[3].toLowerCase()
    
    if (period === 'pm' && hours !== 12) hours += 12
    if (period === 'am' && hours === 12) hours = 0
    
    constraints.start_after = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  // Extract end time
  const endMatch = text.match(/by\s+(\d{1,2})/i)
  if (endMatch) {
    const endHour = parseInt(endMatch[1])
    constraints.must_end_by = `${endHour.toString().padStart(2, '0')}:00`
  }

  // Extract origin
  const originMatch = text.match(/from\s+([^,]+?)(?:\s+at|\s+around|$)/i)
  if (originMatch) {
    constraints.origin = {
      name: originMatch[1].trim(),
      address: originMatch[1].trim()
    }
  }

  // Extract stops with their times
  const stopMatches = [
    ...text.matchAll(/pick\s+up.*?at\s+([^,]+?)(?:\s+at|\s+around|\s+(\d{1,2}):(\d{2})\s*(am|pm)|$)/gi),
    ...text.matchAll(/then\s+([^,]+?)(?:\s+for|\s+at|\s+around|\s+(\d{1,2}):(\d{2})\s*(am|pm)|$)/gi)
  ]

  stopMatches.forEach((match, index) => {
    const stopName = match[1].trim()
    if (stopName && !stopName.includes('home') && !stopName.includes('Donlands')) {
      const stop: any = {
        name: stopName,
        service_min: 20, // Default service time
        priority: 2 as 2
      }

      // Check if there's a time associated with this stop
      const timeMatch = text.match(new RegExp(`${stopName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*?(\\d{1,2}):(\\d{2})\\s*(am|pm)`, 'i'))
      if (timeMatch) {
        let hours = parseInt(timeMatch[1])
        const minutes = parseInt(timeMatch[2])
        const period = timeMatch[3].toLowerCase()
        
        if (period === 'pm' && hours !== 12) hours += 12
        if (period === 'am' && hours === 12) hours = 0
        
        const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
        
        // Look for "not later than" or "by" time constraints
        const notLaterMatch = text.match(new RegExp(`${stopName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*?not\\s+later\\s+than\\s+(\\d{1,2}):(\\d{2})\\s*(am|pm)`, 'i'))
        if (notLaterMatch) {
          let endHours = parseInt(notLaterMatch[1])
          const endMinutes = parseInt(notLaterMatch[2])
          const endPeriod = notLaterMatch[3].toLowerCase()
          
          if (endPeriod === 'pm' && endHours !== 12) endHours += 12
          if (endPeriod === 'am' && endHours === 12) endHours = 0
          
          const endTimeStr = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
          stop.arrive_window = [timeStr, endTimeStr]
        } else {
          // Just a single time, create a 15-minute window
          const endTime = new Date()
          endTime.setHours(hours, minutes + 15, 0, 0)
          const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`
          stop.arrive_window = [timeStr, endTimeStr]
        }
      }

      constraints.stops.push(stop)
    }
  })

  // Also extract times from the original text and try to match them to stops
  const allTimeMatches = [...text.matchAll(/(\d{1,2}):(\d{2})\s*(am|pm)/gi)]
  allTimeMatches.forEach((timeMatch, index) => {
    let hours = parseInt(timeMatch[1])
    const minutes = parseInt(timeMatch[2])
    const period = timeMatch[3].toLowerCase()
    
    if (period === 'pm' && hours !== 12) hours += 12
    if (period === 'am' && hours === 12) hours = 0
    
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    
    // Try to find a stop that doesn't have a time yet and is near this time in the text
    const timeIndex = text.indexOf(timeMatch[0])
    const nearbyStops = constraints.stops.filter((stop: any) => 
      !stop.arrive_window && 
      Math.abs(text.indexOf(stop.name) - timeIndex) < 100
    )
    
    if (nearbyStops.length > 0) {
      const stop = nearbyStops[0]
      // Create a 15-minute window
      const endTime = new Date()
      endTime.setHours(hours, minutes + 15, 0, 0)
      const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`
      stop.arrive_window = [timeStr, endTimeStr]
    }
  })

  // Add home as final destination
  const homeMatch = text.match(/home\s+near\s+([^,]+?)(?:\s+by|$)/i)
  if (homeMatch) {
    constraints.stops.push({
      name: `Home near ${homeMatch[1]}`,
      service_min: 0,
      priority: 1 as 1
    })
  }

  // Set mode preference
  if (text.toLowerCase().includes('subway') || text.toLowerCase().includes('transit')) {
    constraints.preferences.modePriority = ['transit', 'drive', 'walk']
  }

  console.log('Parsed constraints:', JSON.stringify(constraints, null, 2))
  return constraints
}

export async function explainPlan(plan: any, constraints: any): Promise<string> {
  const prompt = `Summarize the commuter's plan: (1) 1-paragraph overview with total time & #stops; (2) bulleted step-by-step with ETAs and label 'tight' if <5 min slack; (3) one Faster and one Cheaper alternative with 1–2 concrete changes; (4) gentle warning if must_end_by may be missed. Output plain text.

Plan: ${JSON.stringify(plan, null, 2)}
Constraints: ${JSON.stringify(constraints, null, 2)}`

  try {
    const output = await replicate.run(
      "mistralai/mistral-7b-instruct-v0.1",
      {
        input: {
          prompt,
          max_tokens: 1500,
          temperature: 0.3,
        }
      }
    ) as string[]

    return output.join('')
  } catch (error) {
    console.error('Replicate explanation error:', error)
    return 'Unable to generate explanation at this time.'
  }
}
