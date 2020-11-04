'use strict';
const request = require('request');

/** @author: Shiv Kumar Ganesh - Added the Quote Plugin */
const Quote = require('inspirational-quotes')

/* AWS Lambda ships with imageMagick out of the box */
var gm = require('gm').subClass({ imageMagick: true, binPath: "/opt/bin" }),
  fs = require('fs'),
  AWS = require('aws-sdk'),
  s3 = new AWS.S3()

var colors = [
  "red",
  "blue",
  "yellow",
  "green"
]
const maxFontSize = 28
const minFontSize = 14

module.exports.create = (event, context, cb) => {
  try {
    console.log(event.queryStringParameters);
    var randomQuote = Quote.getRandomQuote(),
      randomText = "Today's Quote : " + randomQuote,
      sentenseArray = randomText.match(/\b[\w']+(?:[^\w\n]+[\w']+){0,2}\b/g)
    var dogerand = Math.floor(Math.random() * 8 + 1)
    var dogefile = `doge` + dogerand + `.jpg`
    console.log(dogefile)

    const fontFile = '/tmp/helvetica.ttf';
    request('https://ksvotes-v2.s3.amazonaws.com/helvetica.ttf').pipe(fs.createWriteStream(fontFile));

    var image = gm(dogefile).font(fontFile),
      fileNum = Math.floor(Math.random() * 2000),
      fileName = `/tmp/doge-${fileNum}.jpg`,
      s3filename = `doge-${fileNum}.jpg`

    image.size((err, value) => {
      if (err) {
        return cb(err, null)
      }
      var maxWidth = value.width,
        maxHeight = value.height

      console.log("Writing file: ", fileName)

      //Jagruti
      var today = new Date().toISOString().slice(0, 10)
      console.log(today)
      //Jagruti 

      for (var bird of event.queryStringParameters.text.split(" ")) {
        var fontSize = Math.floor(Math.random() * (maxFontSize - minFontSize) + minFontSize + 1),
          x = Math.floor(Math.random() * (maxWidth - (fontSize * bird.length))),
          y = Math.floor(Math.random() * (maxHeight - (fontSize * 2)) + fontSize),
          color = colors[Math.floor(Math.random() * 4)]

        image = image.fontSize(fontSize).fill(color).drawText(x, y, bird)
        console.log('drew text for: ' + bird)
      }
      //Jagruti code changes
      bird = bird.concat(" Current date is  " + today)
      image = image.fontSize(fontSize).fill(color).drawText(x, y, bird)
      //Jagruti code changes

      /** @author: Shiv Kumar Ganesh , Add a daily quote on the image */
      for (let i = 0; i < sentenseArray.length; i++) {
        y += 45;
        image.fontSize(fontSize).fill(color).drawText(x, y, sentenseArray[i]);
      }

      console.log("Writing file: ", fileName)
      image.write(fileName, (err) => {
        if (err) {
          console.log("Error writing file: ", err)
          return cb(err, image)
        }
        var imgdata = fs.readFileSync(fileName)
        var s3params = {
          Bucket: 'iopipe-workshop-doge-sjsu-msse-cmpe-272-j2s2-east-us',
          Key: s3filename,
          Body: imgdata,
          ContentType: 'image/jpeg',
          ACL: "public-read"
        }
        s3.putObject(s3params,
          (err, obj) => {
            cb(err, {
              text: `<https://s3.amazonaws.com/${s3params.Bucket}/${s3filename}>`,
              unfurl_links: true,
              response_type: "in_channel"
            })
          }
        )
      })
    })
  }
  catch (err) {
    return cb(err, null)
  }
}
