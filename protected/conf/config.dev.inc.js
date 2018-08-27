
global['DEBUG'] = true;
global['TYPE_SELF_CALL'] = 'test_spider_self_call';
global['TYPE_MODULE_CALL'] = 'test_spider_self_call';

let dbInfo = {};

dbInfo['Web'] = {
    host : '127.0.0.1',
    user : 'root',
    password : 'root',
    database : 'Web',
    port : 3306,
    connectionLimit : 100
};

dbInfo['Report'] = {
    host : '127.0.0.1',
    user : 'root',
    password : 'ojia305',
    database : 'Report',
    port : 3306,
    connectionLimit : 100
};
//
dbInfo['crawl'] = {
    host : '127.0.0.1',
    user : 'root',
    password : 'root',
    database : 'crawl',
    port : 3306,
    connectionLimit : 100
};

let redisInfo = {};

redisInfo['logstash_redis'] = {
    host : '61.160.36.225',
    port : 6407,
    pwd : 'ojia123',
    db : 2
};

process.env.PORT = 9998;
//
exports.dbInfo = dbInfo;
exports.redisInfo = redisInfo;
