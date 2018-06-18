/**
 * Created by benzhan on 15/8/20.
 */
var co = require('co');
var fs = require('fs');
var Q = require('q');

//var readdir = Q.nbind(fs.readdir)
//co(function* () {
//    console.log(1);
//    var files = yield readdir('./');
//    console.log(files);
//    console.log(2);
//    return files;
//}).then(console.log, console.error);

var compute = function* (a, b) {
    var foo = a + b;
    yield console.log(foo);

    foo = foo + 5;
    yield console.log(foo);

    console.log(23);
};

var generator = compute(4, 2);
generator.next(3, 8);
generator.next("Hello world!"); // Hello world!
generator.next(3, 8);

var i = 1;
console.log('i:' + i);
