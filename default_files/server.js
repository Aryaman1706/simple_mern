const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(express.json());

const port = process.env.PORT || 5000;

const server = app.listen(port, console.log(`Server started on port ${port}`));

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
})
.then(()=>{
    console.log("Connected to MongoDB.")
})
.catch(error=>{
    console.log("Connection to MongoDB failed.\nError Message -> \n" 
                + error
    );
})