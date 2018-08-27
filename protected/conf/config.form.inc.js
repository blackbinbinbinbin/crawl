
global['DEBUG'] = false;
global['TYPE_SELF_CALL'] = 'spider_self_call';
global['TYPE_MODULE_CALL'] = 'spider_self_call';

// let dbInfo = {};
//
// dbInfo['数据库配置名称'] = {
//     host : '服务器ip',
//     user : '数据库用户名',
//     password : '数据库用户密码',
//     database : '库名',
//     port : '端口',
//     connectionLimit : 100
// };


// let redisInfo = {};
//
// redisInfo["redis配置名称"] = {"connet_timeout":"超时时间","host":"redis ip","port":"端口号","pwd":"密码"};

process.env.PORT = 10000;
//
// exports.dbInfo = dbInfo;
// exports.redisInfo = redisInfo;
