"use strict";

let validator = require('validator');
let AppErrors = require('./AppErrors.js');
// let OujRedis = require('./OujRedis.js');
let _ = require('underscore');

class Param {

    constructor(objResponse) {
        this.objResponse = objResponse;
    }

    /**
     * 检查参数
     * @param rules 检查规则
     * {
     *  'appId' : 'int',    //int类型
     *  'owners' : 'array',     //array类型
     *  'instanceIds' : 'intArr',   //array类型，元素为int类型
     *  'instanceTypes' : 'strArr',     //array类型，元素为string类型
     *  'deviceId' : 'int/array',       //int类型或者array类型，最后转化为元素为idArr类型
     *  'deviceClass' : 'string/array',     //string类型或者array类型，最后转化为strArr类型
     *  'blocks' : {type : 'int', range : '(5, 10)'}    //int类型， > 5 , < 10
     *  'blocks2' : {type : 'int', range : '[5, 10]'}   //int类型， >= 5 , <= 10
     *  'percent' : {type : 'float', range : '[5.1, 10.9]'}     //float类型，>= 5.1 , <= 10.9
     *  'appName' : {type : 'string'}       //string类型
     *  'appName2' : {type : 'string', reg : '[^0-9A-Za-z]', 'len' : '[1, 10]', 'nullable' : true}      //string类型，支持正则
     * }
     * @param args 参数合集
     * @param exitError 遇到错误是否直接exit
     * @static
     * @return boolean 是否检查通过
     */
    checkParam(rules, args, exitError) {
        exitError = exitError === false ? exitError : true;

        //_private.getRule(rules, args);

        for (let i in rules) {
            let result = _private.checkRule(rules[i], args, i);

            if (!result['result']) {
                if (exitError) {
                    this.objResponse.error(CODE_PARAM_ERROR, null, result['msg']);

                    // 仅仅是中断后续运行
                    throw new AppErrors.Interrupt(result['msg']);
                } else {
                    return result;
                }
            }
        }

        return _private.succ;
    }

    checkParam2(rules, args, exitError) {
        let flag = this.checkParam(rules, args, exitError);

        for (let i in args) {
            if (!_.has(rules, i)) {
                delete (args[i]);
            }
        }

        return flag;
    }

}


let _private = {
    succ: {
        result: true
    },

    makeRules: function (rules, key) {

    },

    getRule: function (rules, args) {
        if (args['__getRules']) {
            let params = args['__params'];
            params['rules'] = rules;

            for (let i in rules) {
                let value = params['params'][i];
                if (Array.isArray(rules[i])) {
                    value['type'] = rules[i]['type'] || rules[i][0];
                    value['rule'] = _private.genDoc(rules[i]);
                } else if (value) {
                    value['type'] = rules[i];
                }
                params['params'][i] = value;
            }

            // let config = GLOBALS.redisInfo.logstash_redis;
            // let objRedis = OujRedis.init('logstash_redis');
            //if (config && objRedis) {
            //    Response.exitMsg(objRedis);
            //}
        }
    },

    genDoc: function (rules) {
        let str = '';
        if (rules['nullable']) {
            str += '【可为null】';
        }

        if (rules['emptyable']) {
            str += '【可为空值】';
        }

        if (rules['len']) {
            str += "【长度范围：{$rule['len']}】";
        }

        if (rules['range']) {
            str += "【取值范围：{$rule['range']}】";
        }

        if (rules['reg']) {
            str += "【正则：{$rule['reg']}】";
        }

        if (rules['enum']) {
            str += '【值枚举：' + JSON.stringify(rules['enum']) + '】';
        }

        return str;
    },

    checkRule: function (rules, args, key) {
        let type = rules['type'] || rules,
            that = _private,
            result;

        if (type == "int/array") {
            result = that.checkIntArr(rules, args, key);
        } else if (type == "string/array") {
            result = that.checkStrArr(rules, args, key);
        } else if (type) {
            let funcName = "check" + type.charAt(0).toUpperCase() + type.slice(1);
            result = that[funcName].apply(that, [rules, args, key]);
        } else {
            return that.error(key + ': type must not be empty!');
        }
        return result;
    },

    error: function (msg) {
        return {result: false, msg: msg};
    },

    checkBase: function (rules, args, key) {
        let value = args[key],
            that = _private;

        //判断是否可为空
        if (rules['nullable'] && value == null) {
            return _.extend({
                nullable: true
            }, that.succ);
        }

        //判断是否可为0或空字符串
        if ((rules['nullable'] || rules['emptyable']) && !value && value != null) {
            return _.extend({
                emptyable: true
            }, that.succ);
        }

        //判断是否在enum中
        if (rules['enum'] && rules['enum'].indexOf(value) == -1) {
            return that.error(key + ':' + args[key] + ' is not in ' + rules['enum']);
        }

        //判断是否为空
        if (!value) {
            return that.error(key + ' is null or empty!');
        }

        return that.succ;
    },

    checkRange: function (rules, args, key) {
        let range = rules['range'],
            that = _private;

        if (range) {
            range = range.trim();
            let ranges = range.split(',');
            let errMsg = key + ' is not in range ' + range;
            let from = parseFloat(ranges[0].substring(1).trim());

            if (from !== '-' && from !== '~') {
                let flag = ranges[0].charAt(0);
                if (flag === '[' && args[key] < from) {
                    return that.error(errMsg);
                } else if (flag === '(' && args[key] <= from) {
                    return that.error(errMsg);
                }
            }

            let to = parseFloat(ranges[1].slice(0, -1));
            if (to != '+' && to != '~') {
                let flag = ranges[1].slice(-1);
                if (flag === ']' && args[key] > to) {
                    return that.error(errMsg);
                } else if (flag === ')' && args[key] >= to) {
                    return that.error(errMsg);
                }
            }
        }

        return that.succ;
    },

    checkLen: function (rules, args, key) {
        let len = rules['len'],
            that = _private;

        if (len) {
            len = len.trim();
            let ranges = len.split(',');
            let errMsg = key + ' is not valid. len must in' + len;
            let from = parseFloat(ranges[0].substring(1).trim());
            let strLength = args[key].length;

            if (from != '-' && from != '~') {
                let flag = ranges[0].charAt(0);
                if (flag === '[' && strLength < from) {
                    return that.error(errMsg);
                } else if (flag === '(' && strLength <= from) {
                    return that.error(errMsg);
                }
            }

            let to = parseFloat(ranges[1].slice(0, -1));
            if (to != '+' && to != '~') {
                let flag = ranges[1].slice(-1);
                if (flag === ']' && strLength > to) {
                    return that.error(errMsg);
                } else if (flag === ')' && strLength >= to) {
                    return that.error(errMsg);
                }
            }
        }

        return that.succ;
    },

    checkDefault: function (rules, args, key) {
        let that = _private;

        if (rules['emptyable']) {
            rules['emptyable'] = true;
        }

        let result = that.checkBase(rules, args, key);

        if (!result['result'] || result['nullable']) {
            return result;
        }

        result = that.checkRange(rules, args, key);

        if (!result['result']) {
            return result;
        }

        return that.succ;
    },

    checkInt: function (rules, args, key) {
        let that = _private;

        if (rules['emptyable']) {
            rules['emptyable'] = true;
        }

        let result = that.checkBase(rules, args, key);

        if (!result['result'] || result['nullable']) {
            return result;
        }

        if (!validator.isInt(args[key])) {
            return that.error(key + ': ' + args[key] + ' is not int!');
        }

        result = that.checkRange(rules, args, key);

        if (!result['result']) {
            return result;
        }

        return that.succ;
    },

    checkIp: function (rules, args, key) {
        let that = _private;

        let result = that.checkBase(rules, args, key);

        if (!result['result'] || result['nullable']) {
            return result;
        }

        if (!validator.isIP(args[key], 4)) {
            return that.error(key + ': ' + args[key] + ' is not valid ip format!');
        }

        return that.succ;
    },

    checkFloat: function (rules, args, key) {
        let that = _private;

        let result = that.checkBase(rules, args, key);

        if (!result['result'] || result['nullable']) {
            return result;
        }

        if (!validator.isFloat(args[key])) {
            return that.error(key + ': ' + args[key] + ' is not float!');
        }

        result = that.checkRange(rules, args, key);

        if (!result['result']) {
            return result;
        }

        return that.succ;
    },

    checkString: function (rules, args, key) {
        let that = _private;

        if (args[key] !== null && args[key]) {
            args[key] = args[key].toString().trim();
        }

        let result = that.checkBase(rules, args, key);

        if (!result['result'] || result['nullable']) {
            return result;
        }

        result = that.checkLen(rules, args, key);

        if (!result['result']) {
            return result;
        }

        if (rules['reg']) {
            let reg = new RegExp(rules['reg']);
            if (reg.test(args[key])) {
                return that.error(key + ' preg_match error! The reg rule is:' + rules['reg']);
            }
        }

        return that.succ;
    },

    checkArray: function (rules, args, key) {
        let that = _private;

        let result = that.checkBase(rules, args, key);

        if (!result['result'] || result['nullable']) {
            return result;
        }

        if (!Array.isArray(args[key])) {
            return that.error(key + ' is not array');
        }

        return that.succ;
    },

    checkJson: function (rules, args, key) {
        let that = _private;

        let result = that.checkBase(rules, args, key);

        if (!result['result'] || result['nullable']) {
            return result;
        }

        if (!validator.isJSON(args[key])) {
            return that.error(key + ' is not JSON');
        }

        return that.succ;
    },

    checkObject: function (rules, args, key) {
        let that = _private;

        let result = that.checkBase(rules, args, key);

        if (!result['result'] || result['nullable']) {
            return result;
        }

        if (!rules['items']) {
            return that.succ;
        }

        for (let i in rules['items']) {
            result = that.checkRule(rules['items'][i], args[key], i);
            if (!result['result']) {
                result['msg'] = {
                    parent: key
                }
                return result;
            }
        }

        return that.succ;
    },

    checkIntArr: function (rules, args, key) {
        let that = _private;
        return that._checkRuleArr(rules, args, key, 'int');
    },

    checkStrArr: function (rules, args, key) {
        let that = _private;
        return that._checkRuleArr(rules, args, key, 'string');
    },

    checkIpArr: function (rules, args, key) {
        let that = _private;
        return that._checkRuleArr(rules, args, key, 'ip');
    },

    _checkRuleArr: function (rules, args, key, type) {
        let that = _private;

        let result = that.checkArray(rules, args, key);

        if (!result['result'] || result['nullable']) {
            return result;
        }

        for (let i in args[key]) {
            result = that.checkRule(type, args[key], i);
            if (!result['result']) {
                result['msg'] = {
                    parent: key
                }
                return result;
            }
        }

        return that.succ;
    }
};


module.exports = Param;

