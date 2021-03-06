var express = require("express");
var router = express.Router();
var passport = require("passport");
var Camper = require("../models/camper");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");

if (process.env.NODE_ENV === "development") {
  require("dotenv").config();
}

/**root route*/
router.get("/", function(req, res) {
  res.render("landing");
});

/**SHOW REGISTER FORM*/
router.get("/register", function(req, res) {
  res.render("register");
});
router.post("/register", function(req, res) {
  var newUser = new Camper({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password
  });

  Camper.register(newUser, req.body.password, function(err, user) {
    if (err) {
      req.flash("error", err.message);
      console.log(err);
      return res.render("register");
    }
    if (user) console.log("User", user);
    passport.authenticate("local")(req, res, function() {
      req.flash("success", "Welcome to YelpCamp " + user.username);
      res.redirect("/campgrounds");
    });
  });
});

/**SHOW LOGIN FORM */
router.get("/login", function(req, res) {
  res.render("login");
});
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
  }),
  function(req, res) {}
);

/**LOGOUT ROUTE*/
router.get("/logout", function(req, res) {
  req.logout();
  req.flash("success", "Logged You Out!");
  res.redirect("/campgrounds");
});

/**FORGOT PASSWORD ROUTE*/
router.get("/forgot", function(req, res) {
  res.render("forgot");
});

router.post("/forgot", function(req, res, next) {
  async.waterfall(
    [
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString("hex");
          done(err, token);
        });
      },
      function(token, done) {
        Camper.findOne({ email: req.body.email }, function(err, user) {
          if (!user) {
            req.flash("error", "No account with that email address exists.");
            return res.redirect("/forgot");
          }

          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

          user.save(function(err) {
            done(err, token, user);
          });
        });
      },
      function(token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          host: "smtp.fastmail.com",
          service: "Fastmail",
          port: 25,
          secure: false,
          auth: {
            user: "yelpcampadmin@fastmail.com",
            pass: process.env.EMAILPW
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        var mailOptions = {
          to: user.email,
          from: "yelpcampadmin@fastmail.com",
          subject: "Node.js Password Reset",
          text:
            "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
            "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
            "http://" +
            req.headers.host +
            "/reset/" +
            token +
            "\n\n" +
            "If you did not request this, please ignore this email and your password will remain unchanged.\n"
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          console.log("mail sent");
          req.flash(
            "success",
            "An e-mail has been sent to " +
              user.email +
              " with further instructions."
          );
          done(err, "done");
        });
      }
    ],
    function(err) {
      if (err) return next(err);
      res.redirect("/forgot");
    }
  );
});

router.get("/reset/:token", function(req, res) {
  Camper.findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    },
    function(err, user) {
      if (!user) {
        req.flash("error", "Password reset token is invalid or has expired.");
        return res.redirect("/forgot");
      }
      res.render("reset", { token: req.params.token });
    }
  );
});

router.post("/reset/:token", function(req, res) {
  async.waterfall(
    [
      function(done) {
        Camper.findOne(
          {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
          },
          function(err, user) {
            if (!user) {
              req.flash(
                "error",
                "Password reset token is invalid or has expired."
              );
              return res.redirect("back");
            }
            if (req.body.password === req.body.confirm) {
              user.setPassword(req.body.password, function(err) {
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;

                user.save(function(err) {
                  req.logIn(user, function(err) {
                    done(err, user);
                  });
                });
              });
            } else {
              req.flash("error", "Passwords do not match.");
              return res.redirect("back");
            }
          }
        );
      },
      function(user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: "Fastmail",
          auth: {
            user: "yelpcampadmin@fastmail.com",
            pass: process.env.EMAILPW
          }
        });
        var mailOptions = {
          to: user.email,
          from: "yelpcampadmin@fastmail.com",
          subject: "Your password has been changed",
          text:
            "Hello,\n\n" +
            "This is a confirmation that the password for your account " +
            user.email +
            " has just been changed.\n"
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          req.flash("success", "Success! Your password has been changed.");
          done(err);
        });
      }
    ],
    function(err) {
      res.redirect("/campgrounds");
    }
  );
});

module.exports = router;
