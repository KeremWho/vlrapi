var express = require("express");
var router = express.Router();

const getTeam = require("../components/getTeam");

router.get("/", (req, res, next) => {
  // TODO: Add here methods
  res.send("lorem");
});

router.get("/getTeam/:team", async (req, res, next) => {
  let result = await getTeam(req.params.team);
  res.send(result);
});

module.exports = router;
