/* 
* TODO
* Format this properly and shit
*/

//read API keys and shit in

var fs = require('fs');
var keys = JSON.parse(fs.readFileSync('/data/notedrop/api/keys.json','utf8'))

var validator = require('validator');
var express = require('express');
Recaptcha = require('recaptcha-v2').Recaptcha;

var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


var mongo = require('mongodb');
var db = require('monk')(keys.mongodb.username + ':' + keys.mongodb.password + '@' + keys.mongodb.server + ':' + keys.mongodb.port + '/' + keys.mongodb.database);

app.post('/register', function(req,res) {
        res.type('text/json');
        var newuser=req.body;
        var output = {};
        output.errors = new Array();

        //MATCHING PASSWORDS
        if (newuser.password != newuser.confirmpw){
                output.errors.push('passwords do not match');
        }
        //CAPTCHA
        var data = {
                remoteip:  req.connection.remoteAddress,
                response:  newuser["g-recaptcha-response"],
                secret: keys.recaptcha.private
        };
        var recaptcha = new Recaptcha(keys.recaptcha.public, keys.recaptcha.private, data);
        recaptcha.verify(function(success,error_code){
                if (success) {
                        output.message={'success':'you\'re a real boy'};
                } else {
                        output.errors.push(error_code);
                }
        });
        //VALID EMAIL
        if (!(validator.isEmail(newuser.email)))
                output.errors.push('invalid email');
        //USERNAME AND EMAIL NOT TAKEN
        lastValidation(usernameTaken(newuser.username), emailTaken(newuser.email), output, res);
});

function lastValidation(usernameTaken, emailTaken, output, res) {
        if (usernameTaken)
                output.errors.push('username already taken');
        if (emailTaken)
                output.errors.push('email already taken');
        if (output.errors.length)
                res.json({'errors':output.errors});
        else
                res.json(output);;
}


function usernameTaken(username){
        var users = db.get('users');
        users.find({ "username" : username }, function (err, docs){
                if (docs){
                        return true; //if username is in the database, usernameTaken = true
                }
        });
}
function emailTaken(email, output){
        var users = db.get('users');
         users.find({ "email" : email }, function (err, docs){
                if (docs)
                        return true; //if email is in the database, emailTaken =  true
        });
};







app.get('/users/:id', function (req, res) {
  res.type('text/json');
  var users = db.get('users');
  users.findOne({"username" : req.params.id}, function (err, docs){
        if (docs){
                delete docs._id; //we'll use this to only return data the user is authorized to view
                res.json(docs);
        } else {
                res.status(404)
                res.json({"error":404, "description":"user not found"});
        }
  });
});

//KEEP THIS AT THE BOTTOM
app.use(function(req, res){
        res.type('text/json');
        res.status(400);
        res.json({"error":400, "description":"bad request"});

});

app.listen(6969, function () {
  console.log('NoteDrop listening on port 6969!');
});
