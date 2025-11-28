const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRouter = require("./controller/auth");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", authRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
