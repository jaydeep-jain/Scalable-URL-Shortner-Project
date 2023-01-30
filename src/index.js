const express = require('express')
const route = require("./routes/route")
const mongoose = require('mongoose')
const app = express()


app.use(express.json());

mongoose.connect("mongodb+srv://nirmaljasval:8o1g7W6bqoshvXoN@cluster0.cv9nolo.mongodb.net/group6Database-DB",{
    useNewUrlParser:true 
})
.then( () => console.log("MongoDb is connected"))
.catch ( err => console.log(err) )


app.use("/", route)



app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});
