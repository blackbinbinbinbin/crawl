/**
 * Created by benzhan on 15/8/15.
 */

//常规错误码
global["CODE_SUCCESS"] = 0;
global["CODE_UNKNOW_ERROT"] = -1;
global["CODE_NOT_EXIST_INTERFACE"] = -2;
global["CODE_PARAM_ERROR"] = -3;
global["CODE_INTER_ERROR"] = -4;
global["CODE_USER_LOGIN_FAIL"] = -5;
global["CODE_SIGN_ERROR"] = -6;
global["CODE_UNLOGIN_ERROR"] = -7;
global["CODE_NO_PERMITION"] = -8;
global["CODE_NORMAL_ERROR"] = -9;
global["CODE_DB_ERROR"] = -10;
global["CODE_REQUEST_TIMEOUT"] = -11;
global["CODE_REQUEST_ERROR"] = -12;
global["CODE_REDIS_ERROR"] = -13;
global["CODE_UNAUTH_ERROR"] = -14;


var code_map = {
    // 常规错误码
    CODE_SUCCESS: '成功',
    CODE_UNKNOW_ERROT: '未知错误', // 这个需要告警的错误码
    CODE_NOT_EXIST_INTERFACE: '接口不存在',
    CODE_PARAM_ERROR: '参数错误',
    CODE_INTER_ERROR: '系统繁忙，请稍后再试', // http请求返回错误
    CODE_USER_LOGIN_FAIL: '登录态失效，请重新登录',
    CODE_SIGN_ERROR: '签名错误',
    CODE_UNLOGIN_ERROR: '没有登录',
    CODE_NO_PERMITION: '没有权限',
    CODE_NORMAL_ERROR: '常规错误',
    CODE_DB_ERROR: '系统繁忙，请稍后再试', // 这个需要告警的错误码
    CODE_REQUEST_TIMEOUT: '网络请求超时，请重试',
    CODE_REQUEST_ERROR: '访问外部接口出错，请稍后重试', // 这个需要告警的错误码
    CODE_REDIS_ERROR: '系统繁忙，缓存出错，请稍后再试', // 这个需要告警的错误码
    CODE_UNAUTH_ERROR: '未授权',
};

var map = {};
for (var str in code_map) {
    map[global[str]] = code_map[str];
}

module.exports = map;