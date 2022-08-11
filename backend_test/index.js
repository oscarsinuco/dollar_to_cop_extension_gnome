const express = require("express");
const app = express();
const port = 3000;

app.get("/", (_, res) =>
  res.json({ result: Number.parseFloat(4000 * Math.random()).toFixed(2) })
);
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
