"use strict";

var php = require('phpjs');
let Response = require('./Response.js');

class Router {
    constructor(url) {
        //var parts = url.match("http[s]*://[^/]+/([^/]+)/([^/?]+)");
        let parts = url.match(/(http[s]*:\/\/[^/]+)?\/([^/]+)\/([^/?]+)/);

        if (parts && parts.length >= 4) {
            this.controllerName = parts[2];
            this.actionName = parts[3];
        } else {
            this.controllerName = 'default';
            parts = url.match(/(http[s]*:\/\/[^/]+)?\/([^/?]+)/);
            if (parts && parts.length >= 3) {
                this.actionName = parts[2];
            } else {
                this.actionName = 'index';
            }
        }

        global['CONTROLLER_NAME'] = this.controllerName;
        global['ACTION_NAME'] = this.actionName;
    }


    getControllerName() {
        return this.controllerName;
    };

    getActionName() {
        return this.actionName;
    }

    getController() {
        var controllerName = php.ucfirst(this.controllerName);
        var objController;
        try {
            objController = require('../../controllers/' + controllerName + 'Controller.js');
            return objController;
        } catch (ex) {
            console.error(ex);
            return null;
        }
    }

    getFullActionName() {
        return 'action' + php.ucfirst(this.actionName);
    }

    /**
     * 文档处理方法
     * @param type     查询对象类型【module, class, func】
     */
    genDoc(type) {
        var className = this.controllerName,
            funcName = this.getFullActionName();

        className = className.charAt(0).toUpperCase() + className.slice(1);
        var Doc = require('../Doc.js');
        var Controller = require('../Controller.js');

        var doc = new Doc();
        var docController = new Controller;


        switch (type) {
            case "module" :
                var classInfos = doc.getClassInfos(__dirname + '/../../controllers');
                docController.assign({classInfos: classInfos});
                docController.display('doc');
                break;

            case "class" :
                var classInfo = doc.getClassInfo(className);
                docController.assign({classInfos: classInfo});
                docController.display('doc');
                break;

            case "func" :
                var params = doc.getFuncInfo(className, funcName) || {
                        params: {},
                        rules: {}
                    };
                var args = {
                    "__getRules": true,
                    "__params": params
                };

                var Controller2 = require('../../controllers/' + className + 'Controller.js');
                var _controller = new Controller2;

                _controller[funcName].apply(this, [args]);
                break;

            default :
                var msg = 'can not find doc type ' + type;
                Response.error(CODE_NOT_EXIST_INTERFACE, msg);
        }
    }
}


module.exports = Router;
