const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRouter = require("./controller/auth");
const spotifyRouter = require("./controller/spotify");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", authRouter);
app.use("/", spotifyRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
