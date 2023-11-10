const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("Server Is Starting @3000"));
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const convertDbToStatesArray = (objArray) => {
  return {
    stateId: objArray.state_id,
    stateName: objArray.state_name,
    population: objArray.population,
  };
};
const convertDBToDistrictArray = (districtObj) => {
  return {
    districtId: districtObj.district_id,
    districtName: districtObj.district_name,
    stateId: districtObj.state_id,
    cases: districtObj.cases,
    cured: districtObj.cured,
    active: districtObj.active,
    deaths: districtObj.deaths,
  };
};
//Get All States List API 1
app.get("/states/", async (request, response) => {
  const allStatesQuery = `
    SELECT
        * 
    FROM 
       state;`;
  const statesArray = await db.all(allStatesQuery);
  response.send(
    statesArray.map((eachState) => convertDbToStatesArray(eachState))
  );
});
//Get Specific State API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `
    SELECT
        * 
    FROM 
       state
    WHERE 
       state_id=${stateId};`;
  const state = await db.get(stateQuery);
  response.send(convertDbToStatesArray(state));
});
//Create New District API 3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
      INSERT INTO 
          district(district_name,state_id,cases,cured,active,deaths)
     VALUES(
         "${districtName}",
         ${stateId},
         ${cases},
         ${cured},
         ${active},
         ${deaths}
     );`;
  const newDistrict = await db.run(addDistrictQuery);
  const districtId = newDistrict.lastID;
  response.send("District Successfully Added");
});
//Get Specific District API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = `
      SELECT
          *
      FROM
          district
      WHERE
          district_id=${districtId};`;
  const district = await db.get(districtQuery);
  response.send(convertDBToDistrictArray(district));
});
//Delete District API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
       DELETE FROM
           district
       WHERE 
          district_id=${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});
//Update District API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
      UPDATE 
          district
      SET
         district_name="${districtName}",
         state_id=${stateId},
         cases=${cases},
         cured=${cured},
         active=${active},
         deaths=${deaths}
    WHERE
         district_id=${districtId};`;
  const district = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});
//Get Stats Of State API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const statsQuery = `
      SELECT 
         SUM(cases) AS totalCases ,
         SUM(cured) AS totalCured,
         SUM(active) AS totalActive, 
         SUM(deaths) AS totalDeaths 
     FROM 
        district
     WHERE
        state_id=${stateId};`;
  const covidStats = await db.get(statsQuery);
  response.send(covidStats);
});
//State Name API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateNamesQuery = `
       SELECT 
           state_name AS stateName
       FROM 
           district NATURAL JOIN state
       WHERE 
          district_id=${districtId}`;
  const stateName = await db.get(stateNamesQuery);
  response.send(stateName);
});
module.exports = app;
