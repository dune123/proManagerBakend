const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();

// Import routes
const userRoutes = require("./routes/userRoutes");
const taskRoutes=require("./routes/taskRoutes")

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
  // CORS Configuration
// CORS Configuration
const allowedOrigins = [
    'http://localhost:5173',
    'https://task-manager-lemon-mu.vercel.app'
  ];
  
  app.use(cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  }));
  
  // ✅ Add this line to explicitly handle preflight requests
  app.options("*", cors());
  
// Routes
app.use("/api/user", userRoutes);
app.use("/api/task",taskRoutes)

app.listen(process.env.PORT, () => {
    console.log(`listening on ${process.env.PORT}`);
    mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: "proManager"
    })
    .then(() => {
        console.log("connected to Database");
    })
    .catch((err) => {
        console.log(err);
    });
});
