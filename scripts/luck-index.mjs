const SLEEPER_API = 'https://api.sleeper.app/v1'
const WEEKS = 14

function assert(value, message) {
  if (!value) throw new Error(message)
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Request failed ${res.status} for ${url}`)
  return res.json()
}

async function fetchUsers(leagueId) {
  return fetchJson(`${SLEEPER_API}/league/${leagueId}/users`)
}

async function fetchRosters(leagueId) {
  return fetchJson(`${SLEEPER_API}/league/${leagueId}/rosters`)
}

async function fetchMatchupsForWeek(leagueId, week) {
  return fetchJson(`${SLEEPER_API}/league/${leagueId}/matchups/${week}`)
}

function formatNumber(value) {
  return Number(value.toFixed(2))
}

function buildActualRecord(matchupsByWeek) {
  const record = {}

  for (const weekMatchups of Object.values(matchupsByWeek)) {
    const groups = {}
    for (const matchup of weekMatchups) {
      if (!groups[matchup.matchup_id]) groups[matchup.matchup_id] = []
      groups[matchup.matchup_id].push(matchup)
    }

    for (const games of Object.values(groups)) {
      if (games.length !== 2) continue
      const [home, away] = games
      const homePoints = home.points ?? 0
      const awayPoints = away.points ?? 0

      const result = homePoints === awayPoints ? 0.5 : homePoints > awayPoints ? 1 : 0
      const opponentResult = homePoints === awayPoints ? 0.5 : homePoints < awayPoints ? 1 : 0

      record[home.roster_id] = (record[home.roster_id] || 0) + result
      record[away.roster_id] = (record[away.roster_id] || 0) + opponentResult
    }
  }

  return record
}

function buildExpectedWins(matchupsByWeek, teamCount) {
  const expected = {}

  for (const [week, matchups] of Object.entries(matchupsByWeek)) {
    const scores = matchups.map(m => ({ roster_id: m.roster_id, points: m.points ?? 0 }))

    for (const entry of scores) {
      const weeklyWins = scores.reduce((sum, opponent) => {
        if (opponent.roster_id === entry.roster_id) return sum
        if (entry.points > opponent.points) return sum + 1
        if (entry.points === opponent.points) return sum + 0.5
        return sum
      }, 0)

      expected[entry.roster_id] = (expected[entry.roster_id] || 0) + weeklyWins / (teamCount - 1)
    }
  }

  return expected
}

async function buildLuckIndex(leagueId) {
  assert(leagueId, 'Please pass your league ID as the first argument')

  const [users, rosters] = await Promise.all([fetchUsers(leagueId), fetchRosters(leagueId)])
  const rosterMap = new Map(rosters.map(r => [r.roster_id, r.owner_id]))
  const ownerNameByUserId = new Map(users.map(u => [u.user_id, u.display_name || u.username || u.user_id]))

  const matchupsByWeek = {}
  for (let week = 1; week <= WEEKS; week += 1) {
    matchupsByWeek[week] = await fetchMatchupsForWeek(leagueId, week)
  }

  const teamCount = rosters.length
  const actualWins = buildActualRecord(matchupsByWeek)
  const expectedWins = buildExpectedWins(matchupsByWeek, teamCount)

  const ownerRows = []

  for (const roster of rosters) {
    const ownerId = roster.owner_id
    const ownerName = ownerNameByUserId.get(ownerId) || `Owner ${ownerId}`
    const rosterId = roster.roster_id
    const actual = formatNumber(actualWins[rosterId] ?? 0)
    const expected = formatNumber(expectedWins[rosterId] ?? 0)
    const luck = formatNumber(actual - expected)
    const narrative = luck < -2.0 ? 'The League Martyr' : ''

    ownerRows.push({
      ownerName,
      rosterId,
      actualWins: actual,
      expectedWins: expected,
      luckIndex: luck,
      narrative,
    })
  }

  ownerRows.sort((a, b) => a.luckIndex - b.luckIndex)
  return ownerRows
}

async function main() {
  try {
    const leagueId = process.argv[2]
    const output = await buildLuckIndex(leagueId)
    console.log(JSON.stringify(output, null, 2))
  } catch (error) {
    console.error('Error building Luck Index:', error.message || error)
    process.exit(1)
  }
}

main()
