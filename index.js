const express = require("express"),
  bodyParse = require("body-parser"),
  mongoose = require("mongoose"),
  app = express(),
  cors = require('cors'),
  validateSchema = require("./validater"),
  Models = require('./models'),
  DAO = require('./queries'),
  ObjectId = require('mongodb').ObjectID,
  Joi = require('joi'),
  bcrypt = require("bcrypt"),
  http = require('http');
jwt = require("jsonwebtoken");

var server = require("http").Server(app);

require("dotenv").config();
app.disable("x-powered-by");
app.use(cors({ credentials: true, origin: true }));
app.use(bodyParse.json({ limit: "100mb" }));
app.use(bodyParse.urlencoded({ limit: "100mb", extended: true }));
app.use(
  require("express-session")({
    secret: "Once test",
    resave: false,
    saveUninitialized: false,
  })
);


/**
 * @param {*String} name
 * @param {*String} email 
 * @param {*String} password 
 * @desc Saving new user data in db
 * @returns Request if any execption during db exec Otherwise it will save new user data
 */
app.post("/register", async (req, res) => {
  try {
    let schema = Joi.object().keys({
      email: Joi.string().email().required(),
      name: Joi.string().required(),
      password: Joi.string().required()
    });
    let payload = await validateSchema(req.body, schema, {
      presence: "required"
    })

    let isEmailAlready = await Models.User.findOne({ email: payload.email }, {}, { lean: true })
    if (isEmailAlready)
      return res.status(400).json({ msg: "Email is already exists", statusCode: 400 });

    payload.loginTime = new Date().getTime();
    payload.password = await bcrypt.hashSync(payload.password, 10);
    let data = await DAO.saveData(Models.User, payload);
    let tokenData = {
      scope: "user",
      role: "user",
      _id: data._id,
      loginTime: payload.loginTime
    };
    let token = await generateToken(tokenData);
    let dataToSend = {
      token: token,
      email: data.email,
      loginTime: data.loginTime,
      _id: data._id,
      name: data.name,
      createdAt: data.createdAt
    };
    return res
      .status(200)
      .json({ data: dataToSend, msg: "success", statusCode: 200 });

  } catch (err) {
    console.log("err  err err   ", err)
    res.status(400).json({ data: err, msg: "error", statusCode: 400 });
  }
});


/**
 * 
 * @param {*String} email 
 * @param {*String} password
 * @desc used for generating an access token with particular fields of registered user 
 * @returns Promise will return 
 */
app.post("/login", async (req, res) => {
  try {
    let schema = Joi.object().keys({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    });
    let payload = await validateSchema(req.body, schema, {
      presence: "required"
    })

    let findUser = await DAO.getDataOne(Models.User, { email: payload.email }, { password: 1, _id: 1 }, { lean: true });
    if (!findUser) throw "The email address you have entered is not registered with us.";

    let isMatched = await bcrypt.compareSync(
      payload.password,
      findUser.password
    );
    if (!isMatched)
      throw "The password you have entered is invalid";
    payload.loginTime = new Date().getTime();
    let dataToSet = {
      loginTime: payload.loginTime
    };
    let data = await DAO.findAndUpdate(Models.User, { _id: findUser._id }, { $set: dataToSet }, { lean: true, new: true });
    let tokenData = {
      scope: "user",
      role: "user",
      _id: data._id,
      loginTime: payload.loginTime
    };
    let token = await generateToken(tokenData);
    let dataToSend = {
      token: token,
      email: data.email,
      loginTime: data.loginTime,
      _id: data._id,
      name: data.name,
      createdAt: data.createdAt
    };
    return res
      .status(200)
      .json({ data: dataToSend, msg: "success", statusCode: 200 });

  } catch (err) {
    console.log("err  err err   ", err)
    res.status(400).json({ data: err, msg: "error", statusCode: 400 });
  }
});


/**
 * 
 * @param {*String} name 
 * @desc  For test let suppose post created by admin with only one param called name
 * @returns Request if any execption during db exec otherwise it will save new post data
 */
app.post("/createPost", async (req, res) => {
  try {
    let schema = Joi.object().keys({
      name: Joi.string().required()
    });
    let payload = await validateSchema(req.body, schema, {
      presence: "required"
    })

    let findSamePost = await DAO.getDataOne(Models.Post, { name: payload.name }, {}, { lean: true });
    if (findSamePost) throw "Post already exist with same name.";

    let data = await DAO.saveData(Models.Post, payload);

    return res
      .status(200)
      .json({ data: data, msg: "success", statusCode: 200 });

  } catch (err) {
    console.log("err  err err   ", err)
    res.status(400).json({ data: err, msg: "error", statusCode: 400 });
  }
});



/**
 * 
 * @param {*String} post_id 
 * @param {*String} user_id 
 * @param {*Number} rate 
 * @param {*String} comment 
 * @desc User can rate and comment on a particular post
 * @returns Request if any execption during db exec otherwise user will rate and comment on post
 */
app.post("/rateAndCommentOnPost", async (req, res) => {
  try {
    let schema = Joi.object().keys({
      post_id: Joi.string().required(),
      user_id: Joi.string().required(),
      rate: Joi.number().required(),
      comment: Joi.string().required()
    });
    let payload = await validateSchema(req.body, schema, {
      presence: "required"
    })

    let criteria = {
      post_id: ObjectId(payload.post_id),
      user_id: ObjectId(payload.user_id),
      is_deleted: false, is_blocked: false
    }

    let findSamePost = await DAO.getDataOne(Models.Rating, criteria, {}, { lean: true });
    if (findSamePost) throw "You already rate and comment on this post";

    let data = await DAO.saveData(Models.Rating, payload);

    return res
      .status(200)
      .json({ data: data, msg: "success", statusCode: 200 });

  } catch (err) {
    console.log("err  err err   ", err)
    res.status(400).json({ data: err, msg: "error", statusCode: 400 });
  }
});


/**
 *  
 * @desc Calculate Total Ratings Count and Average Ratings(on over all post)
 * @returns Request if any execption during db exec otherwise get count and average ratings of all post
 */
app.get("/calculate", async (req, res) => {
  try {

    let findPostCount = await Models.Rating.aggregate(
      [
        {
          $group:
          {
            _id: null,
            avgRating: { $avg: "$rate" },
            count: { $sum: 1 }
          }
        }
      ]
    )

    return res
      .status(200)
      .json({ data: findPostCount[0], msg: "success", statusCode: 200 });

  } catch (err) {
    console.log("err  err err   ", err)
    res.status(400).json({ data: err, msg: "error", statusCode: 400 });
  }
});




/**
 * 
 * @param {*Number} skip 
 * @param {*Number} limit 
 * @desc List of all post with sorting and pagination
 * @returns Request if any execption during db exec otherwise get list of all post
 */
app.get("/getList", async (req, res) => {
  try {

    let schema = Joi.object().keys({
      skip: Joi.number().allow(''),
      limit: Joi.number().allow('')
    });
    let payload = req.query

    let postList = await Models.Rating.aggregate(
      [
        { "$match": {} },
        {
          "$project": {
            "__v": 0
          }
        },
        { "$sort": { "rate": -1 } },
        { "$skip": Number(payload.skip ? payload.skip : 0) },
        { "$limit": Number(payload.limit ? payload.limit : 10) }
      ]
    )

    return res
      .status(200)
      .json({ data: postList, msg: "success", statusCode: 200 });

  } catch (err) {
    console.log("err  err err   ", err)
    res.status(400).json({ data: err, msg: "error", statusCode: 400 });
  }
});




app.set("port", 3000);
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://127.0.0.1:27017/apptunixDb", {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
});
mongoose.connection.on("error", function (err) {
  console.log("mongo db connection terminate " + err);
  process.exit();
});

mongoose.connection.once("open", function () {
  server.listen(app.get("port"), function (req) { });
  server = http.createServer(app);
  console.log("Node app is running on port", app.get("port"));
});


const generateToken = async val => {
  return new Promise((resolve, reject) => {
    try {
      let key;
      if (val.scope == "user") {
        key = process.env.JWT_SECRET_USER;
      } else {
        key = process.env.JWT_SECRET_ADMIN;
      }
      let token = jwt.sign({ data: val }, key, {
        algorithm: "HS256"
      });
      resolve(token);
    } catch (err) {
      throw err;
    }
  });
};


