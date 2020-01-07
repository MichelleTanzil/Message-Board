const express = require("express");
const app = express();
const session = require("express-session");
app.use(
  session({
    secret: "keyboardkitteh",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
  })
);
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/message_board", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});
const flash = require("express-flash");
app.use(flash());
var validate = require("mongoose-validator");
const CommentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name for comment is required"],
      minlength: [3, "Name for comment must have at least 3 characters"]
    },
    comment: { type: String, required: [true, "Comment content is required"] }
  },
  { timestamps: true }
);
const MessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name for message is required"],
      minlength: [3, "Name for message must have at least 3 characters"]
    },
    message: { type: String, required: [true, "Message content is required"] },
    comments: [CommentSchema]
  },
  { timestamps: true }
);
// create an object that contains methods for mongoose to interface with MongoDB
const Comment = mongoose.model("Comment", CommentSchema);
const Message = mongoose.model("Message", MessageSchema);
var moment = require("moment");
app.use(express.static(__dirname + "/static"));
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.urlencoded({ extended: true }));
app.listen(8000, () => console.log("listening on port 8000"));

app.get("/", (req, res) => {
  Message.find()
    .then(allMessages => {
      res.render("index", { allMessages: allMessages });
    })
    .catch(err => res.json(err));
});

app.post("/message/new", (req, res) => {
  const message = new Message(req.body);
  message
    .save()
    .then(() => res.redirect("/"))
    .catch(err => {
      console.log("We have an error!", err);
      // adjust the code below as needed to create a flash message with the tag and content you would like
      for (var key in err.errors) {
        req.flash("new_message", err.errors[key].message);
      }
      res.redirect("/");
    });
});

app.post("/comment/new/:message_id", (req, res) => {
  console.log("req.body: " + req.body);
  Comment.create(req.body, function(err, data) {
    if (err) {
      console.log("We have an error!", err);
      // adjust the code below as needed to create a flash message with the tag and content you would like
      for (var key in err.errors) {
        req.flash("new_comment", err.errors[key].message);
      }
      res.redirect("/");
    } else {
      Message.findOneAndUpdate(
        { _id: req.params.message_id },
        { $push: { comments: data } },
        function(err, data) {
          if (err) {
            console.log("We have an error on finding the message!", err);
            res.redirect("/");
          } else {
            res.redirect("/");
          }
        }
      );
    }
  });
});
