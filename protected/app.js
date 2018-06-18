'use strict'

let express = require('express');
let path = require('path');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let domain = require('domain');
require('./common.js');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

// 加载扩展函数
require('./extensions/function_extend.js');
let Router = require('./framework/lib/Router.js');
let codeMap = require('./conf/code.inc.js');

let Response = require('./framework/lib/Response.js');
global['AppErrors'] = require('./framework/lib/AppErrors.js');

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    let objDomain = domain.create();
    objDomain.run(function () {
        main(req, res, next);
    });

    objDomain.on('error', function (err) {
        let objResponse = new Response(req, res, codeMap);
        handlerException(objResponse, err);
    });
});

function handlerException(objResponse, err) {
    try {
        if (err instanceof AppErrors.Interrupt) {
            // console.log('catch Interrupt.');
        } else if (err instanceof AppErrors.DbError) {
            objResponse.error(CODE_DB_ERROR, null, err.message, null);
        } else if (err instanceof AppErrors.RedisError) {
            objResponse.error(CODE_REDIS_ERROR, null, err.message, null);
        } else {
            // 对于未知情况，则返回位置错误
            objResponse.error(CODE_UNKNOW_ERROT, null, err.message, null);
        }
    } catch(ex) {
        console.error('catch(ex)');
        console.error(ex);
    }

}

function main(req, res, next) {
    let objRouter = new Router(req.originalUrl);
    /**
     * @type {Doc}
     */
    if(req.query['doc']) {
        objRouter.genDoc(req.query['doc']);
    } else {
        /**
         * @type {Controller}
         */
        let SomeController = objRouter.getController();
        let objResponse = new Response(req, res, codeMap);

        if (SomeController) {
            let objController = new SomeController(req, res);
            let action = objRouter.getFullActionName();
            // 先获取get参数，然后获取post参数
            let args = req.query || req.body || {};
            if (objController[action]) {
                objController[action](args);
            } else {
                let msg = 'can not find function ' + objRouter.getActionName();
                objResponse.error(CODE_NOT_EXIST_INTERFACE, msg);
            }
        } else {
            let msg = 'can not find class ' + objRouter.getControllerName();
            objResponse.error(CODE_NOT_EXIST_INTERFACE, msg);
        }
    }
}

// 捕捉全局异常
// uncaughtException 避免程序崩溃
process.on('uncaughtException', function(err) {
    // let CallLog = require('./framework/lib/CallLog.js');
    // // 记录访问日志
    // let objCallLog = new CallLog(null);
    // let msg = err.message && err.message.message;
    // objCallLog.logSelfCall(CODE_UNKNOW_ERROT, msg);
    // setTimeout(function() {
    //     process.exit(1);
    // }, 100);
});


module.exports = app;