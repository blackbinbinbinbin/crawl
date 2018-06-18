"use strict"

let OujRedis = require('./OujRedis.js');
let php = require('phpjs');

let call_id = null;
let objRedis = OujRedis.init('logstash_redis');

class CallLog {
    constructor(objController) {
        /**
         * @type {Controller}
         */
        this.objController = objController;
    }

    getCallId() {
        if (!call_id) {
            call_id = new Date().getTime() + "" + parseInt(Math.random() * 10000);
        }
        return call_id;
    }

    logSelfCall(code, response) {
        let _req = this.objController && this.objController._req || {};
        let _startTime = this.objController && this.objController._startTime;

        let data = {};
        data['call_id'] = this.getCallId();
        data['url'] = '/' + CONTROLLER_NAME + '/' + ACTION_NAME;
        data['method'] = _req.method;
        let getParam = php.http_build_query(_req.query);
        let postParam = php.http_build_query(_req.body);

        let param = '';
        if (getParam && postParam) {
            param = getParam + '&' + postParam;
        } else if (getParam) {
            param = getParam;
        } else {
            param = postParam;
        }

        data['param'] = param;
        if (_req.headers) {
            data['cookie'] = _req.headers.cookie;
            data['useragent'] = _req.headers['user-agent'];
        }

        if (this.objController && this.objController.debugMsg) {
            response = '【debugMsg:' + this.objController.debugMsg + "】{response}";
        }

        data['response'] = response ? response.substr(0, 3000) : '';
        data['code'] = code;
        let curTime = new Date().getTime();
        data['delay'] = (curTime - _startTime) / 1000;

        data['server_ip'] = getServerIp();
        if (this.objController) {
            data['client_ip'] = getClientIp(this.objController._req);
        } else {
            data['client_ip'] = '0.0.0.0';
        }

        let pushData = {
            'message': data,
            'type': TYPE_SELF_CALL,
            'time': php.date('Y-m-d H:i:s', curTime / 1000)
        };

        writeRedis(pushData);
    }

    logModuleCall(method, toUrl, postData, response, startTime) {
        let data = {};
        data['from_call_id'] = this.getCallId();
        data['from_url'] = '/'.CONTROLLER_NAME + '/' + ACTION_NAME;
        data['method'] = method;

        let parts = explode('?', toUrl);
        data['to_url'] = parts[0];
        let getParam = parts[1];

        let postParam = '';
        if (php.is_array(postData)) {
            postParam = php.http_build_query(postData);
        } else {
            postParam = postData;
        }

        let param = '';
        if (getParam && postParam) {
            param = getParam + '&' + postParam;
        } else if (getParam) {
            param = getParam;
        } else {
            param = postParam;
        }

        data['param'] = param;
        if (response !== false) {
            let objResult = JSON.parse(response);
            data['code'] = objResult['code'];
            data['response'] = response.substr(0, 3000);
        } else {
            data['code'] = CODE_REQUEST_TIMEOUT;
        }

        data['delay'] = new Date().getTime() - startTime;
        data['server_ip'] = getServerIp();

        let pushData = {
            message: data,
            type: TYPE_MODULE_CALL,
            time: php.date('Y-m-d H:i:s', startTime / 1000)
        };

        writeRedis(pushData);
    }

}

function writeRedis(pushData) {
    try {
        let config = GLOBALS['redisInfo']['logstash_redis'];
        if (config) {
            objRedis.rpush('logstash:redis', JSON.stringify(pushData));
        }
    } catch (ex) {
        // 这里需要告警
        if (DEBUG) {
            throw ex;
        }
    }
}

module.exports = CallLog;

