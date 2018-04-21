
global['DEBUG'] = false;
global['TYPE_SELF_CALL'] = 'spider_self_call';
global['TYPE_MODULE_CALL'] = 'spider_self_call';

// let dbInfo = {};
//
// dbInfo['Web'] = {
//     host : '10.25.68.139',
//     user : 'ojuser',
//     password : 'qs45MWKf',
//     database : 'Web',
//     port : 6308,
//     connectionLimit : 100
// };
//
// dbInfo['Report'] = {
//     host : '10.25.68.139',
//     user : 'ojuser',
//     password : 'qs45MWKf',
//     database : 'Report',
//     port : 6308,
//     connectionLimit : 100
// };
//
// dbInfo['crawl'] = {
//     host : '10.25.68.139',
//     user : 'ojuser',
//     password : 'qs45MWKf',
//     database : 'crawl',
//     port : 6308,
//     connectionLimit : 100
// };
//
// dbInfo['dw_pc'] = {
//     host : '10.20.167.232',
//     user : 'dw_sy_rw',
//     password : 'Yn7wx9g5QG',
//     database : 'dw_pc',
//     port : 6301,
//     connectionLimit : 100
// };
//
// dbInfo['dw_pc_data'] = {
//     host : '10.20.167.232',
//     user : 'dw_sy_rw',
//     password : 'Yn7wx9g5QG',
//     database : 'dw_pc_data',
//     port : 6301,
//     connectionLimit : 100
// };

// let redisInfo = {};
//
// redisInfo["logstash_redis"] = {"connet_timeout":"1","host":"10.20.164.64","port":"6399","pwd":"Fh7fVj8fSsKf"};
// redisInfo["logic"] = {"host":"10.20.164.64","port":"6398","pwd":"Fh7fVj8fSsKf"};

process.env.PORT = 10000;
//
// exports.dbInfo = dbInfo;
// exports.redisInfo = redisInfo;
