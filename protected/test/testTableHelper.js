/**
 * Created by benzhan on 15/8/10.
 */
require('../extensions/function_extend.js');
var TableHelper = require('../framework/lib/TableHelper.js');
var objHelper = new TableHelper('cUser', 'Web');

var allDeferred = objHelper.getAll();
allDeferred.then(function(rows) {
    console.log('getAll');
    console.log(rows);
}, console.error);

var keyWord = {_field:'userName'};
var colDeferred = objHelper.getCol({}, keyWord);
colDeferred.then(function(col) {
    console.log('getCol');
    console.log(col);
}, console.error);

var where = {userId:13501489295};
var colDeferred = objHelper.getRow(where);
colDeferred.then(function(row) {
    console.log('getRow');
    console.log(row);
}, console.error);

var data = {userName:'123456', userId:123456, anotherPwd:123};
var addDeferred = objHelper.addObject(data);
addDeferred.then(function(result) {
    console.log('addObject');
    console.log(result);
}, console.error);

var where = {userId:123456};
var newData = {userName:'123456798'};
var updateDeferred = objHelper.updateObject(newData, where);
updateDeferred.then(function(result) {
    console.log('updateObject');
    console.log(result);
});

var where = {userId:123456};
var keyWord = {_field:'userName'};
var oneDeferred = objHelper.getOne(where, keyWord);
oneDeferred.then(function(one) {
    console.log('getOne');
    console.log(one);
}, console.error);

var data = {userName:'1234526', userId:123456, anotherPwd:123};
var replaceDeferred = objHelper.replaceObject(data);
replaceDeferred.then(function(result) {
    console.log('replaceObject');
    console.log(result);
}, console.error);

var where = {userId:123456};
var delDeferred = objHelper.delObject(where);
delDeferred.then(function(result) {
    console.log('delObject');
    console.log(result);
}, console.error);



