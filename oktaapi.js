//oktaapi.js
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

//constants
console.log(process.argv[2]);
console.log(process.argv[3]);

var MODULE = "OKTA API"
var PORT = process.env.PORT || 10001; 	// set port
var oktaURL  = process.argv[2];
var oktaAPI  = "/api/v1";
var oktaKey  = "SSWS "+process.argv[3];

//libraries
var express	  = require('express');					// use express framework
var https	  = require('https');
var bodyParser 	= require('body-parser');				// use module to parse form bodies

var app = express();
    app.use(bodyParser.urlencoded( {extended: true} ));
    app.use(bodyParser.json());						// used for getting POST data

var router   = express.Router();						// create express router

router.use( function (request, response, next) {
	console.log("Api called!");
	next();		// go to next route
});

router.get('/', function(request, response) {
    response.status(200).json({ message: MODULE + ' service running!' });   
});

//gets 200 users and recursively calls itsself if a next link is available
var get200users = function(pHttpOptions, pResult, i, callback) {
        console.log('nesting: ' + i);
	
	responseBody="";
	responseHeaders="";

	var myReq = https.request(pHttpOptions, function(myRes) {

                responseHeadersLink=myRes.headers.link;

                myRes.setEncoding('utf8');

                myRes.on('data', (chunk) => {
                	responseBody+=chunk;
                });

                myRes.on('end', () => {
			responseObj = pResult.concat(JSON.parse(responseBody));
                        
			if(responseHeadersLink.indexOf('next') >0) {
                        	nextLink=responseHeadersLink.split(",")[1].split(";")[0];
                                nextLink=nextLink.slice(29,nextLink.length-1)
                                pHttpOptions.path = nextLink;

				get200users(pHttpOptions,responseObj, i+1 , function(response) {
					callback(responseObj);
				});
                        }
			else {
			 	callback(responseObj);
			}
                });
	});
	myReq.on('error', (err) => {
       		console.log('Error: ', err);
	});
        myReq.end();
}


// Basic user functions:
//   GET  /user = Retrieve all users
router.route('/users')

	// get all genera
	.get(function(request, response) {
		console.log("GET : users");

		var httpHeaders = {
			'Accept'	: 'application/json',
			'Content-Type'	: 'application/json',   
			'Authorization'	: oktaKey
		};

		var httpOptions = {
			host: oktaURL,
			path: oktaAPI + '/users',
			method: 'GET',
			headers : httpHeaders
		};


		get200users(httpOptions, pResult =[], 0, function(pResponse) {
			console.log("Records : " +pResponse.length); 
			response.status(200).json(pResponse);
		});
	});

app.use('/', router);										// use express router

// Main Application
var server = app.listen(PORT, function () {
   	var host = server.address().address
   	var port = server.address().port
	
   	console.log("OKTA API listening at http://%s:%s", host, port)
})

