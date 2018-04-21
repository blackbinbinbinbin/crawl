'use strict'

/**
 * @author hawklim
 */

require('../conf/config.dev.inc.js');

var r2m_client = require('../framework/lib/r2m/Client.js');
var co = require('co');


 //co(function*() {
	// let objCate = new r2m_client('category', 'hiyd_cms', 'hiyd_cms');
 //
	// let where = {'name':'上肢'};
 //	let val1 = yield objCate.getRow(where);
 //	console.log(val1);
 //
 //	let val2 = yield objCate.getAll();
 //	console.log(val2);
 //
 //	let where2 = {id:3};
 //	let val3 = yield objCate.getRow(where2);
 //	console.log(val3);
 //
	// let objUser = new r2m_client('user', 'hiyd_home', 'hiyd_home')
	// let val4 = yield objUser.getAll({user_id:20});
	// console.log(val4);
 //
	// let objTags = new r2m_client('tags', 'hiyd_cms', 'hiyd_cms');
	// let val5 = yield objTags.getAll();
	// console.log(val5);
 //});

let objCate = new r2m_client('category', 'hiyd_cms', 'hiyd_cms');
let where = {};
objCate.getAll().then((val3) => {
	console.log(val3);
}).catch((err) => {
	console.log(`err ${err}`);
});
objCate.getAll().then((val3) => {
	console.log(val3);
}).catch((err) => {
	console.log(`err ${err}`);
});
where['name'] = '上肢';
objCate.getRow(where).then((val) => {

	console.log(val);

}).catch((err) => {
   console.log(`err ${err}`);
});
objCate.getAll().then((val) => {

	console.log(val);

}).catch((err) => {
	console.log(`err ${err}`);
});
 let objTags = new r2m_client('tags', 'hiyd_cms', 'hiyd_cms');
 objTags.getAll().then(function(val5) {
	 console.log(val5);
 });
