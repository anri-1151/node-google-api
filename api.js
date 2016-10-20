var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var nodeApi6 = require('./routes/node-api6');
var nodeApi3 = require('./routes/node-api3');
var nodeApi1 = require('./routes/node-api1');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/node-api/get-six-stages', nodeApi6);
app.use('/node-api/get-three-stages', nodeApi3);
app.use('/node-api/get-one-stages', nodeApi1);

// catch 404 and forward to error handler
app.use(function(req, res, next){
    res.status(404);
    console.log('%s %d %s', req.method, res.statusCode, req.url);
    res.json({
        error: 'Not found'
    });
    return;
});

// error handlers
app.use(function(err, req, res, next){
    res.status(err.status || 500);
    console.log('%s %d %s', req.method, res.statusCode, err.message);
    res.json({
        error: err.message
    });
    return;
});


module.exports = app;


