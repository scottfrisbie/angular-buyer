var router = require('express').Router();
var request = require('request');
var q = require('q');

router.route('/list')
    .post(function(req, res){
        return ListTaxInfo(req.body.File)
            .then(function(data){
                res.status(200).json({Data: data});
            })
            .catch(function(ex){
                res.status(400).json({Error: ex});
            });
    });

function ListTaxInfo(body, res){
    var token = new Buffer('four51:H0oJq6ZJgHNoZJMO').toString('base64');
    var requestBody = {
        url: "https://b2b-test.etundra.com/taxQuote",
        headers: {
            "Content-Type": "application/json", 
            "Authorization": "Basic " + token
        },
        rejectUnauthorized: false,
        json: body
    };
    var deferred = q.defer();
    request.post(requestBody, 
        function(error, response, body){
           deferred.resolve(body);
    });
    return deferred.promise;
}

module.exports = router;