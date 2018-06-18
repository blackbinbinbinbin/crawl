
/*
 * 配置说明，注意all_key字段不能更改（不然，deleteListCache会有问题）
 r2mInfo[dbKey][tableName] = {
     'key' : 'key',
     'all_key' : 'all_key',
     'ttl' : '每条数据的缓存时间，0为永久缓存，其他为秒数',
 };
*/

var DEFAULT_R2M_TTL = 3600;
var r2mInfo = {};
var Web = {};

Web['cUser'] = {
    key : 'userId',
    all_key : 'enable',
    ttl : DEFAULT_R2M_TTL
};

r2mInfo['Web'] = Web;

module.exports = r2mInfo;
