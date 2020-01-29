var express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  flash = require("connect-flash"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  methodOverride = require("method-override"),
  Campground = require("./models/campground"),
  Comment = require("./models/comment"),
  Camper = require("./models/camper"),
  seedDB = require("./seeds");

//REQUIRING ROUTES
var commentRoutes = require("./routes/comments"),
  campgroundRoutes = require("./routes/campgrounds"),
  indexRoutes = require("./routes/index");

// DB config - MongoDB Atlas
const dbURI = require("./config/keys").mongoURI;

// Connect to MongoDB
mongoose.connect(dbURI, { useNewUrlParser: true }).then(
  () => {
    console.log("MongoDB connection established");
  },
  err => {
    console.log("Error connecting Database instance due to: ", err);
  }
);

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
// seedDB(); //seed the database

//passport configuration
app.use(
  require("express-session")({
    secret: "Abby is the cutest dog",
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(Camper.authenticate()));
passport.serializeUser(Camper.serializeUser());
passport.deserializeUser(Camper.deserializeUser());

app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

const port = process.env.PORT || 5000;

app.listen(port, process.env.IP, function() {
  console.log(`YelpCamp Server running on localhost:${port}`);
});
