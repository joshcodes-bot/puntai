import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SPORT_KEYS = [
  { key: 'rugbyleague_nrl',                label: 'NRL',         emoji: '🏉' },
  { key: 'rugbyunion_six_nations',         label: 'Six Nations', emoji: '🏉' },
  { key: 'soccer_epl',                     label: 'EPL',         emoji: '⚽' },
  { key: 'soccer_uefa_champs_league',      label: 'UCL',         emoji: '⚽' },
  { key: 'soccer_uefa_europa_league',      label: 'Europa',      emoji: '⚽' },
  { key: 'soccer_australia_aleague',       label: 'A-League',    emoji: '⚽' },
  { key: 'soccer_germany_bundesliga',      label: 'Bundesliga',  emoji: '⚽' },
  { key: 'soccer_spain_la_liga',           label: 'La Liga',     emoji: '⚽' },
  { key: 'soccer_italy_serie_a',           label: 'Serie A',     emoji: '⚽' },
  { key: 'basketball_nba',                 label: 'NBA',         emoji: '🏀' },
  { key: 'basketball_nbl',                 label: 'NBL',         emoji: '🏀' },
  { key: 'tennis_atp_indian_wells',        label: 'Tennis',      emoji: '🎾' },
  { key: 'tennis_wta_indian_wells',        label: 'Tennis',      emoji: '🎾' },
  { key: 'mma_mixed_martial_arts',         label: 'MMA',         emoji: '🥊' },
  { key: 'icehockey_nhl',                  label: 'NHL',         emoji: '🏒' },
]

async function fetchOddsForSport(sportKey: string, apiKey: string, from: string, to: string) {
  try {
    const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=au&markets=h2h&oddsFormat=decimal&commenceTimeFrom=${from}&commenceTimeTo=${to}`
    const res = await fetch(url, { next: { revalidate: 1800 } })
    if (!res.ok) return []
    return await res.json()
  } catch { return [] }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const day = searchParams.get('day') === 'tomorrow' ? 'tomorrow' : 'today'

    const oddsApiKey  = process.env.ODDS_API_KEY
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!oddsApiKey || !anthropicKey) {
      return NextResponse.json({ picks: [], error: 'Missing API keys' }, { status: 500 })
    }

    // Build time window — use NZT offset (UTC+13 standard, UTC+13 daylight)
    // We add 13h to UTC to get NZ "today", then build windows accordingly
    const now = new Date()
    const NZ_OFFSET_MS = 13 * 60 * 60 * 1000 // NZT UTC+13
    const nowNZ = new Date(now.getTime() + NZ_OFFSET_MS)

    let from: Date, to: Date

    if (day === 'tomorrow') {
      // "Upcoming" — next 5 days from now (covers weekend rounds, fixtures posted early)
      from = new Date(now)
      to = new Date(now)
      to.setDate(to.getDate() + 5)
      to.setHours(23, 59, 59, 999)
    } else {
      // "Today" in NZT — from now until end of NZ calendar day
      from = new Date(now)
      // End of today in NZT = start of NZT tomorrow midnight minus 1ms, converted back to UTC
      const nzTomorrowMidnight = new Date(nowNZ)
      nzTomorrowMidnight.setDate(nzTomorrowMidnight.getDate() + 1)
      nzTomorrowMidnight.setHours(0, 0, 0, 0)
      to = new Date(nzTomorrowMidnight.getTime() - NZ_OFFSET_MS)
    }

    // Fetch all sports in parallel
    const results = await Promise.all(
      SPORT_KEYS.map(async (s) => {
        const games = await fetchOddsForSport(s.key, oddsApiKey, from.toISOString(), to.toISOString())
        return { ...s, games }
      })
    )

    // Flatten into analysable game list
    const allGames: any[] = []
    for (const sport of results) {
      for (const game of (sport.games ?? []).slice(0, 5)) {
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
      const label = day === 'tomorrow' ? 'the next 5 days' : 'today'
      return NextResponse.json({
        picks: [],
        error: `No games found for ${label}. The leagues may be on a break, or odds aren't posted yet.`,
        generatedAt: new Date().toISOString()
      })
    }

    const dateLabel = day === 'tomorrow'
      ? `the next few days (${from.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} onwards)`
      : nowNZ.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

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
          content: `You are a sharp sports betting analyst for PUNT.AI, used by serious punters in Australia/NZ. The games below are on ${dateLabel}.

Here are the REAL games with actual Australian bookmaker odds:

${JSON.stringify(allGames, null, 2)}

Select the 4-6 BEST VALUE BETS. Be a sharp bettor:
- Find value where odds seem too generous for the actual probability
- Consider form, head-to-head, home advantage, travel, key absences
- Do NOT just back favourites — back VALUE
- Only use games from the list above

Respond ONLY with a JSON array, no markdown, no backticks:

[
  {
    "id": 1,
    "sport": "EPL",
    "event": "exact event name from data",
    "market": "Match Winner",
    "pick": "exact team name from data",
    "odds": 2.10,
    "confidence": 78,
    "reasoning": "2-3 sharp sentences on why this is value",
    "commenceTime": "commence_time from data"
  }
]

Rules: exact names/odds from data · confidence 55–92 · reasoning must be specific · prefer odds 1.60–3.50`
        }]
      })
    })

    const aiData = await response.json()
    const text = aiData.content?.[0]?.text ?? '[]'

    let picks
    try {
      picks = JSON.parse(text.replace(/```json|```/g, '').trim())
    } catch { picks = [] }

    return NextResponse.json({ picks, generatedAt: new Date().toISOString(), gamesAnalysed: allGames.length, day })
  } catch (err) {
    console.error('AI picks error:', err)
    return NextResponse.json({ picks: [], error: 'Failed to generate picks' }, { status: 500 })
  }
}
