const UrlModel = require('../model/urlModel')
const validUrl = require('valid-url')
const RandomString = require('randomstring')
const redis = require("redis");

// Here we create radis server and connect to radis cach memory to use cashing in this code.
const { promisify } = require("util");

const redisClient = redis.createClient(
  15819,
  "redis-15819.c266.us-east-1-3.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("XB9K1HiqkdfJBlgyjj8dSoxrVnLl4PI1", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const isValid = (value) => {
    if(typeof value === 'undefined' || value === null) return false
    if(typeof value === 'string' && value.trim().length === 0) return false
    if(typeof value === 'number') return false
    return true;
}

//-----------------------Post Api--------------------------------

const generateShortUrl = async (req, res) => {
    try {

        /****************************************Validation**************************************/
        const longUrl = req.body.longUrl

        if(!isValid(longUrl)) return res.status(400).send({ status: false, message: "Please provide long Url first! (type-string)" })
              
        if (!(validUrl.isWebUri(longUrl.trim()))) return res.status(400).send({ status: false, message: "Please Provide a valid long Url" })

      /****************************************Searching in Redis Server***********************************/  
        let LongUrl = await GET_ASYNC(`${longUrl}`)
        let LongUrlCache = JSON.parse(LongUrl)
        if (LongUrlCache) return res.status(200).send({ status: true, msg: "Already a shortUrl exist with this Url in Cache", urlDetails: LongUrlCache })

       /****************************************Searching in Data base******************************/  
        let url = await UrlModel.findOne({ longUrl: longUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 })

        // url exist and return the respose
        if (url) {
            await SET_ASYNC(`${longUrl}`,JSON.stringify(url))
            return res.status(302).send({ status: true, msg: "Already a shortUrl exist with this Url in DB", urlDetails: url })
        }

        /****************************************Short urlCode Generation******************************/  
        let urlCode = RandomString.generate({ length: 6, charset: "alphabetic" }).toLowerCase()

        let shortUrl = `http://localhost:3000/${urlCode}`

        let data = {
            urlCode: urlCode,
            longUrl: longUrl,
            shortUrl: shortUrl
        }
       
        /****************************Creating document in DB****************************/
        let urlDetails = await UrlModel.create(data)

        let result = {
            urlCode: urlDetails.urlCode,
            longUrl: urlDetails.longUrl,
            shortUrl: urlDetails.shortUrl
        }
        await SET_ASYNC(`${longUrl}`, JSON.stringify(result))

        return res.status(201).send({ status: true, data: result })
    }
    catch (err) {
        console.log(err)
        res.status(500).send({ staus: false, error: err.message })
    }

}

const flushRedisCache = (req, res) => {
    redisClient.flushall('ASYNC', (err, data) => {
        if(err)
            console.log(err)
        else if(req.body) 
            console.log("Memory flushed: ",req.body)
    })
    res.status(200).send({msg: "Redis memory cleared"})
}

//---------------------Get Api-----------------------------------

const getUrl = async function (req, res) {
    try {
        let data = req.params.urlCode

        let catchedUrlData = await GET_ASYNC(`${data}`)
        let parseData = JSON.parse(catchedUrlData)

        if(catchedUrlData){
            res.status(302).redirect(302, `${parseData.longUrl}`)
        }else{
            let urlData = await UrlModel.findOne({urlCode: data})
            if(!urlData) return res.status(404).send({status: false, message: "Sort url doesn't exists!"})

            await SET_ASYNC(`${data}`, JSON.stringify(urlData))

            res.status(302).redirect(302, `${urlData.longUrl}`)

        }

    }

    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = { generateShortUrl, getUrl, flushRedisCache }