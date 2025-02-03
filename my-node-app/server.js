const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello from AWS EKS Node.js App!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
