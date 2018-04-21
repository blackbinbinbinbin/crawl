const Response = require('./lib/Response.js');
const Param = require('./lib/Param.js');

class Controller extends Response {
    constructor(req, res) {
        super(req, res);

        if (res) {
            res.header("Cache-Control", "private");
            res.header('Content-Type', 'text/html;charset=' + DEFAULT_CHARSET);
        }

        /**
         * 模板数据
         * @type {{}}
         * @private
         */
        this._tpl_data = {};
        this._startTime = new Date().getTime();
        this._req = req;
        this._res = res;
        this._objParam = new Param(this);
    }

    /**
     * 检查参数
     * @param rules 检查规则
     * {
     *     'appId' : 'int',    //int类型
     *     'owners' : 'array',     //array类型
     *     'instanceIds' : 'intArr',   //array类型，元素为int类型
     *     'instanceTypes' : 'strArr',     //array类型，元素为string类型
     *     'deviceId' : 'int/array',       //int类型或者array类型，最后转化为元素为idArr类型
     *     'deviceClass' : 'string/array',     //string类型或者array类型，最后转化为strArr类型
     *     'blocks' : {type : 'int', range : '(5, 10)'}    //int类型， > 5 , < 10
     *     'blocks2' : {type : 'int', range : '[5, 10]'}   //int类型， >= 5 , <= 10
     *     'percent' : {type : 'float', range : '[5.1, 10.9]'}     //float类型，>= 5.1 , <= 10.9
     *     'appName' : {type : 'string'}       //string类型
     *     'appName2' : {type : 'string', reg : '[^0-9A-Za-z]', 'len' : '[1, 10]', 'nullable' : true}      //string类型，支持正则
     * }
     * @param args 参数合集
     * @param exitError 遇到错误是否直接exit
     * @static
     * @return boolean 是否检查通过
     */
    checkParam(rules, args, exitError) {
        this._objParam.checkParam(rules, args, exitError);
    }

    checkParam2(rules, args, exitError) {
        this._objParam.checkParam2(rules, args, exitError);
    }

    assign(key, value) {
        if (typeof key === 'object') {
            for (let k in key) {
                this._tpl_data[k] = key[k];
            }
        } else {
            this._tpl_data[key] = Object.assign(value, this._tpl_data[key]);
        }
    };

    display(tpl) {
        tpl = tpl || CONTROLLER_NAME + '/' + ACTION_NAME;
        this._res.render(tpl, this._tpl_data);
    }
}

module.exports = Controller;
