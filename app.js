const express = require("express");
const app = express();

const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

app.use(express.json());

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertPlayerMatchDbObjectToResponseObject = (dbObject) => {
  return {
    PlayerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//API 1
//Returns a list of all the players in the player table
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
      *
    FROM
      player_details;`;
  const playersArray = await database.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

//API 2
//Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
      *
    FROM 
      player_details 
    WHERE 
      player_id = ${playerId};`;
  const player = await database.get(getPlayerQuery);
  response.send(convertPlayerDbObjectToResponseObject(player));
});

//API 3
//Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
  UPDATE
    player_details
  SET
    player_name = '${playerName}'
  WHERE
    player_id = ${playerId};`;
  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4
//Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
      *
    FROM 
      match_details 
    WHERE
      match_id = ${matchId};`;
  const match = await database.get(getMatchQuery);
  response.send(convertMatchDbObjectToResponseObject(match));
});

//API 5
//Returns a list of all the matches of a player
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `
    SELECT
      *
    FROM
       player_match_score
    NATURAL JOIN
       match_details
    WHERE
      player_id = ${playerId};`;
  const playerMatches = await database.all(getPlayerMatchQuery);
  response.send(
    playerMatches.map((eachMatch) =>
      convertMatchDbObjectToResponseObject(eachMatch)
    )
  );
});

//API 6
//Returns a list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT
      *
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      match_id = ${matchId};`;
  const playersArray = await database.all(getMatchPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});
//   const getPlayerMatchQuery = `
//     SELECT
//       *
//     FROM
//       player_details`;
//   const players = await database.get(getPlayerMatchQuery);
//   response.send(
//     players.map((eachPlayer) =>
//       convertPlayerDbObjectToResponseObject(eachPlayer)
//     )
//   );
// });

//API 7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayersQuery = `
    SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const playersMatchDetails = await database.get(getMatchPlayersQuery);
  response.send(playersMatchDetails);
});

//   const getPlayerStatsQuery = `
// SELECT
//   player_id
//   player_name,
//   SUM(score),
//   SUM(fours),
//   SUM(sixes)
// FROM
//   player_match_score
// NATURAL JOIN
//   player_details
// WHERE
//   player_id=${playerId};`;
//   const stats = await database.get(getPlayerStatsQuery);
//   response.send({
//     playerId: stats.player_id,
//     playerName: stats.player_name,
//     totalScore: stats["SUM(score)"],
//     totalFours: stats["SUM(fours)"],
//     totalSixes: stats["SUM(sixes)"],
//   });

module.exports = app;
