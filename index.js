const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const {MongoClient} = require('mongodb');
const {Schema} = mongoose;
mongoose.connect(process.env['MONGO_URL']);
const client = new MongoClient(process.env['MONGO_URL']);

const UserSchema = new Schema({username: String});
const User = mongoose.model("User", UserSchema);

const ExerciseSchema = new Schema({
  user_id: {type:String, required: true},
  description:String,
  duration:Number,
  date: Date
});
const Exercise = mongoose.model("Exercise", ExerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({
  extended:true
}))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get("/api/users", async (req, res) => {
  const users = await User.find({}).select("_id username");
  if (!users) {
    res.send("No Users");
    return;
  } else {
    res.json(users);
  }
})

app.post('/api/users', async (req, res) => {
  const userobj = new User({
    username: req.body.username
  })
  const user = await userobj.save();
  res.json(user);
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const user = await User.findById(req.params._id);
  if (!user){
    res.send("Could not find user")
  } else {
  
  const exercise  = new Exercise({
    user_id: user._id,
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date ? new Date(req.body.date) : new Date()
  })
  
  const ex = await exercise.save();
  res.json({
    _id: user._id,
    username: user.username,
    description: ex.description,
    duration: ex.duration,
    date: new Date(ex.date).toDateString()
  });
  }
})

app.get("/api/users/:_id/logs", async (req, res) => {
  const {from, to, limit} = req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  if (!user){
    res.send("No User")
    return;
  }
  let dateObj = {}
  if (from){
    dateObj["$gte"] = new Date(from)
  }
  if (to){
    dateObj["$lte"] = new Date(to)
  }
  let filter = {
    user_id: id
  }
  if (from || to){
    filter.date = dateObj;
  }
  const exercises = await Exercise.find(filter).limit(+limit ?? 500)

  const log = exercises.map(e=>({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }))
  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
