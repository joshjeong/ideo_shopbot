var fs = require('fs');
var express = require('express');
var router = express.Router();
var request = require('request');
var Client = require('node-rest-client').Client;
var client = new Client();
var trait = "BIG5,Satisfaction_Life,Intelligence,Age,Female,Gay,Lesbian,Concentration,Politics,Religion,Relationship";
var _ = require('underscore')._
var app = express();
var json2csv = require('json2csv');

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/getPredictions', function(req, res){
    var credentials = {
        "customer_id": 3206,
        "api_key": "houl2vd0tuiv1ivg4gg7qo891c"
    }

    request.post(
        'https://api.applymagicsauce.com/auth',
        { json: credentials },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var likes = req.body.likes;
                var userId = req.body.userId;
                var name = req.body.name;
                getPredictions(res, body.token, likes, userId, name);
            } else {
                console.warn('ERROR fetching magic token: ' + error)
            }
        }
    );
});

router.post('/addEmotionData', function(req, res){
    var parsedJSON = require('../data/temp.json');
    var fields = ['BIG5_Openness', 'BIG5_Conscientiousness', 'BIG5_Extraversion', 'BIG5_Agreeableness', 'BIG5_Neuroticism', 'sock_1', 'sock_2', 'sock_3', 'sock_4', 'sock_5', 'sock_6'];
    var userData = {};
    var quizResults = req.body;
    var trainingData ={};
    var otherData = {};

    userData.id = parsedJSON.id;

    _.each(parsedJSON.predictions, function(prediction) {
        var trait = prediction.trait;
        if (trait == 'BIG5_Openness' || trait == 'BIG5_Conscientiousness' || trait == 'BIG5_Extraversion' || trait == 'BIG5_Agreeableness' || trait == 'BIG5_Neuroticism' ) {
            userData[trait] = prediction.value/100;
        }
    });

    trainingData = _.clone(userData);
    trainingData.sock_1 = quizResults[0].is_selected;
    trainingData.sock_2 = quizResults[1].is_selected;
    trainingData.sock_3 = quizResults[2].is_selected;
    trainingData.sock_4 = quizResults[3].is_selected;
    trainingData.sock_5 = quizResults[4].is_selected;
    trainingData.sock_6 = quizResults[5].is_selected;

    otherData = _.clone(userData);
    otherData.sock_1 = quizResults[0].avg_engagement;
    otherData.sock_2 = quizResults[1].avg_engagement;
    otherData.sock_3 = quizResults[2].avg_engagement;
    otherData.sock_4 = quizResults[3].avg_engagement;
    otherData.sock_5 = quizResults[4].avg_engagement;
    otherData.sock_6 = quizResults[5].avg_engagement;

    parsedJSON.quizResults = quizResults;

    var trainingCsv = json2csv({ data: trainingData, fields: fields, hasCSVColumnTitle: false, newLine: true}) + '\n';
    var otherCsv = json2csv({ data: otherData, fields: fields, hasCSVColumnTitle: false, newLine: true}) + '\n';

    fs.appendFile('data/training-data.csv', trainingCsv, function(err) {
      if (err) throw err;
      console.log('training data saved');
    });

    fs.appendFile('data/other-data.csv', otherCsv, function(err) {
      if (err) throw err;
      console.log('other data saved');
    });

    fs.writeFile('data/' +  userData.id + '.json', JSON.stringify(parsedJSON, null, 2));

    res.send('success');
});

function getPredictions(res, token, likes, userId, name) {
    console.warn('------------------')
    console.warn('------------------')
    console.warn('id: ', userId)
    console.warn('token: ',token)
    console.warn('likes: ',likes)
    console.warn('name: ',name)
    console.warn("http://api-v2.applymagicsauce.com/like_ids?interpretations=true&contributors=true&traits=" + trait + "&uid=" + userId)
    console.warn('------------------')
    console.warn('------------------')

      var args = {
         data: likes,
         headers: {
             "X-Auth-Token": token,
             "Content-Type": "application/json",
             "Accept": "application/json"
         }
     };

     client.post("http://api-v2.applymagicsauce.com/like_ids?interpretations=true&contributors=true&traits=" + trait + "&uid=" + userId,
         args,
         function(data, response) {
             var statusCode = response.statusCode;
             if (statusCode == 200) {
                 console.warn('success');
                 console.warn(data);
                 saveData(data, userId, name);
                 res.send(data);
             } else if (statusCode == 204) {
                 console.warn('no prediction could be made based on like ids provided');
             } else {
                 console.warn('error');
             }
         });
}

function saveData(data, userId, name) {
    data.id = userId;
    data.name = name;
    fs.writeFile("./data/temp.json", JSON.stringify(data, null, 2));
}


module.exports = router;
