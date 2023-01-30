const urlModel = require("../models/urlShortnerModel");
const shortid = require("shortid");
const redis = require("redis");
const { promisify } = require("util");




//============================Connect to redis======================
const redisClient = redis.createClient(
 
 
 
  14434,
  "redis-14434.c301.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("yxZVNhGgPf8MSsx8BBAWKQeiyzi53cTy", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});



//==============================promisify============================

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const isValid = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  return true;
};



// //==========================================creating url==========================




const createUrl = async function (req, res) {
  try {
    let { longUrl } = req.body;

    if (!Object.keys(req.body).length > 0) {
      return res
        .status(400)
        .send({
          status: false,
          message: "Please enter recommended data in body",
        });
    };


    if (req.body.urlCode || req.body.shortUrl) {
      return res
        .status(400)
        .send({ status: false, messsage: "you have to enter only longUrl" });
    };

    if (!isValid(longUrl)) {
      return res.status(400).send({ status: false, message: "longUrl is required" });
    };

    let url = /^www\.[a-z0-9-]+(?:\.[a-z0-9-]+)*\.+(\w)*/

    if(url.test(longUrl)){
      longUrl="https://"+longUrl
    }

    const isValidUrl = (urlString) => {
      return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(urlString)
    }
  if(!isValidUrl(longUrl)){
    return res.status(400).send({status: false, message: "longUrl is not valid"})
  }


    let cache = await GET_ASYNC(`${longUrl}`);
    if (cache) {
      cache = JSON.parse(cache);
      
      return res.status(200).send({ status: true, message: "Data from Cache", data: cache });

    }

    let checkExistUrl = await urlModel.findOne({ longUrl: longUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id:0 });

    if (checkExistUrl) {
      await SET_ASYNC(`${longUrl}`,JSON.stringify(checkExistUrl),"EX",600);

      return res.status(200).send({status: true, message: "url already present",data: checkExistUrl});
    }

    const urlCode = shortid.generate().toLowerCase();

    const baseUrl = "http://localhost:3000";

    const obj = {
      longUrl: longUrl,
      shortUrl: baseUrl + "/" + urlCode,
      urlCode: urlCode,
    };
    const createUrl = await urlModel.create(obj);
    return res
      .status(201)
      .send({ status: true, message: "shortUrl created", data: obj });
  } catch (err) {
    res
      .status(500)
      .send({ status: false, message: "server error", error: err.message });
  }
};

//---------------------------------------------get--------------------------------------------------------------------

const geturl = async function (req, res) {
  try {
    let urlCode = req.params.urlCode;

    if(/.*[A-Z].*/.test(urlCode)){
      return res.status(400).send({ status: false, message: "please Enter urlCode only in lowercase" })
  }
    

    let cachedata = await GET_ASYNC(`${urlCode}`);

    cachedata = JSON.parse(cachedata);

    if (cachedata) {

      res.redirect(cachedata.longUrl);

    } else {

      let orignalUrl = await urlModel.findOne({ urlCode: urlCode }).select({ _id: 0, longUrl: 1 });
      if (!orignalUrl)
      return res.status(404).send({ status: false, message: "urlCode not found" });

      await SET_ASYNC(`${urlCode}`, JSON.stringify(orignalUrl), "EX", 600);

      return res.status(302).redirect(orignalUrl.longUrl);
    }
  } catch (err) {

    return res.status(500).send({ status: false, message: "server error", error: err.message });

  }
};

module.exports = { createUrl, geturl };
