'use strict';

require('../extensions/function_extend.js');
var co = require('co');
var R2M = require('../framework/lib/Redis2Mysql.js');
var objR2m = new R2M('cUser', 'Web', 'Web');

co(function*() {
    //var where = {userId:13501489295};
    //var row = objR2m.getRow(where);
    //console.log(row);


    //var where = {enable:1};
    //// var where = {userId:13501489295};
    //var data = yield objR2m.getAll(where);
    //console.log(data);


    var userId = 12345;
    where = {userId:userId};
    var row = yield objR2m.getRow(where);
    if (!row) {
        console.log('addObject');
        var data = {userId:userId, userName:'MyTest', enable:1, anotherPwd:'another'};
        var result = yield objR2m.addObject(data);
    } else {
        console.log('updateObject');
        var data = {userName:'edddrwe11223', enable:1, anotherPwd:'another'};
        var where = {userId:userId};
        var result = yield objR2m.updateObject(data, where);
        console.log(result);

        console.log('replaceObject');
        var args = {userId:userId, userName:'edddrwe11', enable:1, anotherPwd:'another'};
        var result = yield objR2m.replaceObject(args);
        console.log(result);

        if (result.changedRows == 0) {
            console.log('delObject');
            var result = yield objR2m.delObject(where);
            console.log(result);
        }

    }


    setTimeout(function() {
        objR2m.close();
    }, 1000);
    console.log('end');

    return 2333;

}).then(console.log, console.error);


process.on('exit', function(code) {
    console.log('About to exit with code:', code);
});






