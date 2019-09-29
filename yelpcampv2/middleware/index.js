var validator = require("validator");
var isEmpty = require("is-empty");

var Campground = require("../models/campground");
var Comment = require("../models/comment");
// ALL THE MIDDLEWARE GOES HERE
var middlewareObj = {};

middlewareObj.checkCampgroundOwnership = function(req, res, next) {
  if (req.isAuthenticated()) {
    Campground.findById(req.params.id, function(err, foundCampground) {
      if (err || !foundCampground) {
        req.flash("error", "Campground Not Found");
        res.redirect("back");
      } else {
        //does user own the campground?
        if (foundCampground.author.id.equals(req.user._id)) {
          next();
        } else {
          req.flash("error", "You Don't Have Permission To Do That!");
          res.redirect("back");
        }
      }
    });
  } else {
    req.flash("error", "You Need To Be Logged In To Do That!");
    res.redirect("back");
  }
};

middlewareObj.checkCommentOwnership = function(req, res, next) {
  if (req.isAuthenticated()) {
    Comment.findById(req.params.comment_id, function(err, foundComment) {
      if (err || !foundComment) {
        req.flash("error", "Comment Not  Found");
        res.redirect("back");
      } else {
        //does user own the comment?
        if (foundComment.author.id.equals(req.user._id)) {
          next();
        } else {
          req.flash("error", "You Don't Have Permission To Do That!");
          res.redirect("back");
        }
      }
    });
  } else {
    req.flash("error", "You Need to Be Logged In To Do That!");
    res.redirect("back");
  }
};

middlewareObj.isLoggedIn = function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error", "You Need To Be Logged In To Do That!");
  res.redirect("/login");
};

middlewareObj.validateRegisterInput = function validateRegisterInput(
  req,
  res,
  data,
  next
) {
  //Convert empty fields to a string so validator functions will work
  data.username = !isEmpty(data.username) ? data.username : "";
  data.email = !isEmpty(data.email) ? data.email : "";
  data.password = !isEmpty(data.password) ? data.password : "";

  //Check for empty email field
  if (validator.isEmpty(data.username)) {
    req.flash("error", "Username field is required!");
    res.redirect("/register");
  } else if (validator.isEmpty(data.email)) {
    req.flash("error", "Email field is required!");
    res.redirect("/register");
  } else if (!validator.isEmail(data.email)) {
    req.flash("error", "Invalid email format!");
    res.redirect("/register");
  } //Password Validation
  else if (validator.isEmpty(data.password)) {
    req.flash("error", "Password field is required!");
    res.redirect("/register");
  }
  next();
};

module.exports = middlewareObj;
