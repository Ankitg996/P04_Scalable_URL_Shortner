const UrlModel = require('../model/urlModel')
const validUrl = require('valid-url')
const RandomString = require('randomstring')
//=-----------------------Post Api------------------------
const generateShortUrl = async function (req, res) {
    try {
        let data = req.body

        if (!Object.keys(data).length) return res.status(400).send({ status: false, message: " You must provide data first " })

        if (!(validUrl.isWebUri(data.longUrl.trim()))) return res.status(400).send({ status: false , message: "Please Provide a valid long Url"})

        let checkUrl = await UrlModel.findOne({longUrl: data.longUrl})

        if(checkUrl) return res.status(400).send({status: false, message: " Long url already Exists! and already shorted"})

        let shortUrlCode = RandomString.generate({length: 6, charset: "alphabetic"}).toLowerCase()

        let shortUrl = `http://localhost:3000/${shortUrlCode}`

        data.urlCode = shortUrlCode;
        data.shortUrl = shortUrl;

        let createUrl = await UrlModel.create(data)
        return res.status(201).send({status: true, data: createUrl})     

    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}
//---------------------Get Api------------------------------




module.exports = generateShortUrl