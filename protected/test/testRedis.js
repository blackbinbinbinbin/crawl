/**
 * Created by benzhan on 15/8/10.
 */

var OujRedis = require('../framework/lib/OujRedis.js');
var objRedis = OujRedis.init('Web');

var test = objRedis.get('test');
test.then(function(data) {
    console.log(data);
    objRedis.set('test', data + "1").then(function(data) {
        console.log(data);
        test = objRedis.get('test');
        test.then(function(data) {
            console.log(data);
            objRedis.disconnect();
        }, function(err) {
            console.log(err);
            objRedis.disconnect();
        });
    });
}, function(err) {
    console.log(err);
});

var pipeline = objRedis.pipeline();
pipeline.exists('foo');
pipeline.set('foo', 'bar');
pipeline.exists('foo');
pipeline.get('foo');
pipeline.del('foo');
pipeline.exists('foo');
test = pipeline.exec();
test.then(function (results) {
    // `err` is always null, and `results` is an array of responses
    // corresponding to the sequence of queued commands.
    // Each response follows the format `[err, result]`.
    console.log('pipeline');
    console.log(results);
}, function(err) {
    console.error(err);
});


