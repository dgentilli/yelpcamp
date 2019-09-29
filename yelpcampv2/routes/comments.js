var express = require("express");
var router = express.Router({ mergeParams: true });
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//comments new route
router.get("/new", middleware.isLoggedIn, function(req, res) {
  Campground.findById(req.params.id, function(err, campground) {
    if (err) {
      console.log(err);
    } else {
      res.render("comments/new", { campground: campground });
    }
  });
});

//comments create route
router.post("/", middleware.isLoggedIn, function(req, res) {
  //lookup cg using id
  Campground.findById(req.params.id, function(err, campground) {
    if (err) {
      console.log(err);
      res.redirect("/campgrounds");
    } else {
      let commentData = {
        author: req.user_id,
        username: req.user.username //req.author.username;
        //commentData.created = Date.now;
      };

      const newComment = new Comment(commentData);
      newComment.save();
      console.log(req.body.comment);
      Comment.create(req.body.comment, function(err, comment) {
        if (err) {
          req.flash("error", "Something Went Wrong");
          console.log(err);
        } else {
          //add username and id to comment
          comment.author.id = req.user._id;
          comment.author.username = req.user.username;
          comment.created = Date.now;
          //save comment
          comment.save();
          campground.comments.push(comment);
          campground.save();
          console.log(comment);
          req.flash("success", "Successfully Added Comment!");
          res.redirect("/campgrounds/" + campground._id);
        }
      });
    }
  });
});

//COMMENT EDIT ROUTE
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(
  req,
  res
) {
  Campground.findById(req.params.id, function(err, foundCampground) {
    if (err || !foundCampground) {
      req.flash("error", "No Campground Found");
      return res.redirect("back");
    }
    Comment.findById(req.params.comment_id, function(err, foundComment) {
      if (err) {
        res.redirect("back");
      } else {
        res.render("comments/edit", {
          campground_id: req.params.id,
          comment: foundComment
        });
      }
    });
  });
});

// COMMENT UPDATE
router.put("/:comment_id", middleware.checkCommentOwnership, function(
  req,
  res
) {
  Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(
    err,
    updatedComment
  ) {
    if (err) {
      res.redirect("back");
    } else {
      res.redirect("/campgrounds/" + req.params.id);
    }
  });
});

//COMMENT DESTROY ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, function(
  req,
  res
) {
  //findByIdAndRemove
  Comment.findByIdAndRemove(req.params.comment_id, function(err) {
    if (err) {
      res.redirect("back");
    } else {
      req.flash("success", "Successfully Deleted Comment!");
      res.redirect("/campgrounds/" + req.params.id);
    }
  });
});

module.exports = router;
