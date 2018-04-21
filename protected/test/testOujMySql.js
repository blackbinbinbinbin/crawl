"use strict";

require('../extensions/function_extend.js');
let OujMySql = require('../framework/lib/OujMySql.js');
let objMysql = new OujMySql('Web');

var sql = "SELECT * FROM  `cUser`";
var allDeferred = objMysql.getAll(sql, 5);
allDeferred.then(function(rows) {
    console.log('getAll');
    console.log(rows);

    objMysql.close();
});

//var sql = "SELECT userName FROM  `cUser`";
//var oneDeferred = objMysql.getOne(sql);
//oneDeferred.then(function(one) {
//    console.log('getOne');
//    console.log(one);
//}, function(err) {
//    console.log(err);
//});
//
//
//var colDeferred = objMysql.getCol(sql, 3);
//colDeferred.then(function(col) {
//    console.log('getCol');
//    console.log(col);
//});
//
//var colDeferred = objMysql.getRow(sql);
//colDeferred.then(function(row) {
//    console.log('getRow');
//    console.log(row);
//});

//
//var updateSql = "";
//
//objMysql.update(sql, function(err, rows) {
//    console.log('getAll');
//    console.log(rows);
//}, 5);

//setTimeout(function() {
//    objMysql.close(function() {
//        console.log('close');
//    });
//}, 1000);


