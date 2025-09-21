import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function parseConstraints(text: string): Promise<any> {
  const systemPrompt = `Extract ONLY strict JSON per the Constraint type. If the user mentions a pickup 'at 3:15', set arrive_window to ['15:05','15:25']. Default service_min=10. If a mode is implied ('subway'), set by='transit'. If data missing, put null. Do not invent precise coordinates.`

  try {
    const output = await replicate.run(
      "meta/meta-llama-3.1-70b-instruct",
      {
        input: {
          prompt: `${systemPrompt}\n\nUser: ${text}\n\nAssistant:`,
          max_tokens: 1000,
          temperature: 0.1,
        }
      }
    ) as string[]

    const response = output.join('')
    
    // Extract JSON from response (look for last {...} pattern)
    const jsonMatch = response.match(/\{[\s\S]*\}/g)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }
    
    const jsonStr = jsonMatch[jsonMatch.length - 1]
    return JSON.parse(jsonStr)
  } catch (error) {
    console.error('Replicate parsing error:', error)
    throw new Error('Failed to parse constraints from text')
  }
}

export async function explainPlan(plan: any, constraints: any): Promise<string> {
  const prompt = `Summarize the commuter's plan: (1) 1-paragraph overview with total time & #stops; (2) bulleted step-by-step with ETAs and label 'tight' if <5 min slack; (3) one Faster and one Cheaper alternative with 1–2 concrete changes; (4) gentle warning if must_end_by may be missed. Output plain text.

Plan: ${JSON.stringify(plan, null, 2)}
Constraints: ${JSON.stringify(constraints, null, 2)}`

  try {
    const output = await replicate.run(
      "meta/meta-llama-3.1-70b-instruct",
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
