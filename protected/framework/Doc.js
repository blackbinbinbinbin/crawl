var fs = require('fs');
var Buffer = require('buffer').Buffer;
function Doc() {

}

Doc.prototype.getClassName = function(filePath) {
    fs.open(filePath, 'r', function(err, fd) {
        var contents = "";

        var raw = new Buffer(1024);

        fs.read(fd, raw, 0, raw.length, null, function(err, bytesRead, buffer) {
            var buf = buffer.slice(0, bytesRead);

            contents += buf.toString().split('module.exports = ')[1].split(';')[0];

            fs.close(fd, function() {
                console.log(contents);
            })
        })
    })
}

Doc.prototype.getClassInfos = function(path) {
    var fileNames = fs.readdirSync(path);
    var classInfos = {};
    var that = this;
    for(var i in fileNames) {
        var className = fileNames[i].split('Controller.js')[0];
        classInfos[className] = {
            author : "",
            desc : "",
            funcs : that.getFunc(className)
        }
    }
    return classInfos;
}

/**
 * 获取类的信息
 * @param className     类名
 */
Doc.prototype.getClassInfo = function(className) {
    return;
}

/**
 * 获取接口信息
 * @param className     类名
 * @param funcName      接口名
 */
Doc.prototype.getFuncInfo = function(className, funcName) {
    var controllerName = className.charAt(0).toUpperCase() + className.slice(1);
    var Controller;

    try{
        //Controller = require('../controllers/' + controllerName + 'Controller.js');
        //var objFunc = Controller.prototype[funcName];
        //return
    } catch(e) {
        console.error(e);
    }
}

Doc.prototype.getFunc = function(className) {
    var controllerName = className.charAt(0).toUpperCase() + className.slice(1);
    var Controller;

    try{
        Controller = require('../controllers/' + controllerName + 'Controller.js');
        var funcList = {};

        for(var i in Controller.prototype) {
            if(i.match('action')){
                funcList[i] = {
                    author : "",
                    desc : "",
                    param : []
                }
            }
        }
        return funcList;
    } catch(e) {
        console.error(e);
        return null;
    }
}

module.exports = Doc;
