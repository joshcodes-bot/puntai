import { NextResponse } from 'next/server'

// Sport keys for The Odds API
const SPORT_KEYS = [
  { key: 'rugbyleague_nrl',          label: 'NRL',      emoji: '🏉' },
  { key: 'rugbyunion_world_cup',     label: 'Rugby Union', emoji: '🏉' },
  { key: 'rugbyunion',               label: 'Rugby Union', emoji: '🏉' },
  { key: 'soccer_epl',               label: 'EPL',      emoji: '⚽' },
  { key: 'soccer_uefa_champs_league',label: 'UCL',      emoji: '⚽' },
  { key: 'soccer_uefa_europa_league',label: 'Europa',   emoji: '⚽' },
  { key: 'basketball_nba',           label: 'NBA',      emoji: '🏀' },
  { key: 'mma_mixed_martial_arts',   label: 'UFC/MMA',  emoji: '🥊' },
]

async function fetchOddsForSport(sportKey: string, apiKey: string) {
  try {
    const now = new Date()
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)

    const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=au&markets=h2h&oddsFormat=decimal&commenceTimeFrom=${now.toISOString()}&commenceTimeTo=${todayEnd.toISOString()}`
    const res = await fetch(url, { next: { revalidate: 1800 } })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export async function GET() {
  try {
    const oddsApiKey = process.env.ODDS_API_KEY
    const anthropicKey = process.env.ANTHROPIC_API_KEY

    if (!oddsApiKey || !anthropicKey) {
      return NextResponse.json({ picks: [], error: 'Missing API keys' }, { status: 500 })
    }

    // Fetch today's games across all sports in parallel
    const results = await Promise.all(
      SPORT_KEYS.map(async (s) => {
        const games = await fetchOddsForSport(s.key, oddsApiKey)
        return { ...s, games }
      })
    )

    // Flatten and format games with real odds
    const allGames: any[] = []
    for (const sport of results) {
      for (const game of sport.games.slice(0, 5)) {
        const bookmaker = game.bookmakers?.[0]
        const h2h = bookmaker?.markets?.find((m: any) => m.key === 'h2h')
        if (!h2h) continue
        const outcomes = h2h.outcomes
        allGames.push({
          sport: sport.label,
          event: `${game.home_team} vs ${game.away_team}`,
          commenceTime: game.commence_time,
          home_team: game.home_team,
          away_team: game.away_team,
          odds: {
            [game.home_team]: outcomes.find((o: any) => o.name === game.home_team)?.price,
            [game.away_team]: outcomes.find((o: any) => o.name === game.away_team)?.price,
            Draw: outcomes.find((o: any) => o.name === 'Draw')?.price,
          }
        })
      }
    }

    if (allGames.length === 0) {
      return NextResponse.json({ picks: [], error: 'No games found for today. Check back later or try tomorrow.', generatedAt: new Date().toISOString() })
    }

    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

    // Send real games to Claude for analysis
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `You are a sharp sports betting analyst for PUNT.AI, an AI betting platform used by serious punters in Australia/NZ. Today is ${today}.

Here are TODAY'S REAL upcoming games with actual bookmaker odds (Australian decimal odds):

${JSON.stringify(allGames, null, 2)}

Your job is to select the BEST VALUE BETS from these real games. Be a sharp bettor:
- Look for value where the odds seem too generous
- Consider recent form, head-to-head records, home advantage, injuries if known
- Do NOT just pick favourites — pick VALUE
- Be specific and confident in your reasoning
- Only pick games from the list above — these are real games happening today

Select 4-6 of the best picks. For each pick, respond ONLY with a JSON array (no markdown, no backticks, no explanation outside the JSON):

[
  {
    "id": 1,
    "sport": "EPL",
    "event": "exact event name from the data",
    "market": "Match Winner",
    "pick": "exact team name from the data",
    "odds": 2.10,
    "confidence": 78,
    "reasoning": "2-3 sentences of sharp analysis explaining why this is value",
    "commenceTime": "time from the data"
  }
]

Rules:
- Use EXACT team names and odds from the data provided
- confidence between 55 and 92
- reasoning must be genuine sharp analysis, not generic
- prefer picks with odds between 1.60 and 3.50 for value
- vary sports if possible`
        }]
      })
    })

    const aiData = await response.json()
    const text = aiData.content?.[0]?.text ?? '[]'

    let picks
    try {
      const clean = text.replace(/```json|```/g, '').trim()
      picks = JSON.parse(clean)
    } catch {
      picks = []
    }

    return NextResponse.json({ picks, generatedAt: new Date().toISOString(), gamesAnalysed: allGames.length })
  } catch (err) {
    console.error('AI picks error:', err)
    return NextResponse.json({ picks: [], error: 'Failed to generate picks' }, { status: 500 })
  }
}
