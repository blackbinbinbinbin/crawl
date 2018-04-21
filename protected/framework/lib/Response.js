"use strict";

let CallLog = require('./CallLog.js');

class Response {

    constructor(req, res) {
        this._req = req;
        this._res = res;
        this.codeMap = require('../../conf/code.inc.js');
    }

    /**
     * sucess
     * @param {Array|String|Number} data 返回的数据
     * @param {String} msg 返回的msg
     * @param {String} debugMsg 调试的msg
     * @author benzhan
     */
    success(data, msg, debugMsg) {
        let code = CODE_SUCCESS;
        this.debugMsg = debugMsg;

        msg = msg || this.codeMap[code];
        if (global['DEBUG'] && debugMsg) {
            msg = msg + " 【调试信息:" + debugMsg + "】";
        }

        let ret = {
            result: 1,
            code: code,
            msg: msg,
            data: data
        };

        this.exitData(ret);
    }

    /**
     * error with code
     * @param {Number} code
     * @param {String} msg
     * @param {String} debugMsg
     * @param {String} extData
     * @author benzhan
     */
    error(code, msg, debugMsg, extData) {
        this.debugMsg = debugMsg;

        msg = msg || this.codeMap[code];
        if (global['DEBUG'] && debugMsg) {
            msg = msg + " 【调试信息:" + debugMsg + "】";
        }

        let ret = {
            result: 0,
            code: code,
            msg: msg
        };

        if (extData) {
            ret['data'] = extData;
        }

        this.exitData(ret);
    }

    exitData(ret) {
        let json = JSON.stringify(ret);
        if (!this._res._headerSent) {
            this._res.header('Content-Type', 'application/json;charset=' + DEFAULT_CHARSET);
        }
        this.exitMsg(json, ret['code']);
    }

    exitMsg(content, code) {
        let res = this._res;
        let req = this._req;
        code = code || CODE_SUCCESS;

        //必须是字符串
        if (typeof content !== "string") {
            content = JSON.stringify(content);
        }

        //jquery jsonp callback处理
        if (req.query && req.query.callback) {
            if (/^jQuery(\d+)_(\d+)$/.test(req.query.callback)) {
                content = req.query.callback + '(' + content + ');';
            }
        }

        // 记录访问日志
        let objCallLog = new CallLog(this);
        objCallLog.logSelfCall(code, content);

        if (!res.finished) {
            res.write(content);
            res.end();
        }
    }

}


module.exports = Response;
