const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()

const databasePath = path.join(__dirname, 'cricketMatchDetails.db')

app.use(express.json())

let database = null

const initalzeDataBaseAndSever = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running')
    })
  } catch (e) {
    console.log(`DataBase : ${e.message}`)
    process.exit(1)
  }
}

initalzeDataBaseAndSever()

const convertToResponseObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

app.get('/players/', async (request, response) => {
  const getPlayersQuery = `
    SELECT
    *
    FROM
    player_details;`
  const playersArray = await database.all(getPlayersQuery)
  response.send(
    playersArray.map(eachPlayer => convertToResponseObject(eachPlayer)),
  )
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `
    SELECT
    *
    FROM
    player_details
    WHERE player_id = ${playerId};`
  const player = await database.get(getPlayerQuery)
  response.send(convertToResponseObject(player))
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const updatePlayerQuery = `UPDATE player_details
   SET 
   player_name = "${playerName}";
   WHERE
   player_id = ${playerId}
   `
  await database.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

const covertToResponseObject2 = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchDetailsQuery = `
    SELECT
    *
    FROM
    match_details 
    WHERE match_id = ${matchId};`
  const match = await database.get(getMatchDetailsQuery)
  response.send(covertToResponseObject2(match))
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getMatchesOfPlayer = `
   SELECT
   *
   FROM
   player_match_score
   NATURAL JOIN 
   match_details
   WHERE player_id = ${playerId};
   `
  const matches = await database.all(getMatchesOfPlayer)
  response.send(matches.map(eachMatch => covertToResponseObject2(eachMatch)))
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getPlayersQuery = `
  SELECT 
  player_details.player_id AS playerId,
  player_details.player_name AS playerName
  FROM
  player_match_score
  NATURAL JOIN
  player_details
  WHERE player_match_score.match_id = ${matchId};`
  const players = await database.all(getPlayersQuery)
  response.send(players)
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getStatsOfPlayer = `
  SELECT 
  player_details.player_id AS playerId,
  player_details.player_name AS playerName,
  SUM(player_match_score.score) AS totalScore,
  SUM(fours) AS totalFours,
  SUM(sixes) AS totalSixes
  FROM player_details 
  INNER JOIN player_match_score  
  ON player_details.player_id = player_match_score.player_id
  WHERE player_details.player_id = ${playerId}`
  const statsOfPlayer = await database.get(getStatsOfPlayer)
  response.send(statsOfPlayer)
})

module.exports = app
