import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `You are an AI sports betting analyst for PUNT.AI. Today is ${today}.

Generate 4 realistic sports betting picks for today. These should be plausible events that could be happening around this date across different sports.

Respond ONLY with a JSON array, no other text, no markdown, no backticks. Example format:
[
  {
    "id": 1,
    "event": "Team A vs Team B",
    "market": "Match Winner",
    "pick": "Team A",
    "odds": 2.10,
    "confidence": 84,
    "sport": "Football",
    "reasoning": "One sentence explaining the pick"
  }
]

Rules:
- odds must be between 1.40 and 4.00
- confidence must be between 60 and 95
- sports should vary: mix of Football, NBA, Tennis, NFL, UFC, Cricket, Rugby
- make events sound realistic for the current date
- reasoning should be 1 concise sentence max`
          }
        ],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text ?? '[]'

    let picks
    try {
      picks = JSON.parse(text)
    } catch {
      picks = []
    }

    return NextResponse.json({ picks, generatedAt: new Date().toISOString() })
  } catch (err) {
    console.error('AI picks error:', err)
    return NextResponse.json({ picks: [], error: 'Failed to generate picks' }, { status: 500 })
  }
}
