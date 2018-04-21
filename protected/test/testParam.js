var Param = require('../framework/lib/Param.js');

var rules = {
    'checkIntArr' : {
        type : 'intArr'
    },
    'checkObj' : {
        type : 'object'
    },
    'checkJson' : {
        type : 'json'
    },
    'appId' : {
        type : 'string',
        range : '(5, 10)'
    },
    'str' : {
        type : 'float',
        len : '[0, 10]'
    },
    'nullable' : {
        type : 'string',
        nullable : true
    }
}

var args = {
    'checkIntArr' : [111,222,333],
    'checkObj' : {
        qwe : 111,
        fff : 322
    },
    'checkJson' : '{"111":123,"qqq":333}',
    'appId' : 6,
    'str' : 123,
    'nullable' : '',
    'fake' : '123'
}

var testResult = Param.checkParam2(rules, args);
console.log(args);

