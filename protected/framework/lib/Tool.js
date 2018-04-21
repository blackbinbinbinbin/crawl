"use strict";

const php = require('phpjs');

/**
 * 调试日志(只有DEBUG为true时, 才记录)
 * @author benzhan
 * @param content 调试内容
 * @param callLevel 调用深度
 */
function debug(content, callLevel) {
    callLevel = callLevel || 1;
    if (DEBUG) {
        writeLog(content, 'debug', callLevel);
    }
}

/**
 * 记录流水日志
 * @author benzhan
 * @param content 流水日志内容
 * @param callLevel 调用深度
 */
function log(content, callLevel = 1) {
    callLevel = callLevel || 1;
    writeLog(content, 'log', callLevel);
}

/**
 * 记录警告日志
 * @author benzhan
 * @param content 流水日志内容
 * @param callLevel 调用深度
 */
function warning(content, callLevel = 1) {
    callLevel = callLevel || 1;
    writeLog(content, 'warning', callLevel);
}


/**
 * 记录错误日志
 * @author benzhan
 * @param content 流水日志内容
 * @param callLevel 调用深度
 */
function err(content, callLevel = 1) {
    callLevel = callLevel || 1;
    writeLog(content, 'error', callLevel);
}


let logs = [];
let recordLog = false;

function startRecordLog() {
    recordLog = true;
    logs = [];
}

function writeLog(content, label = 'log', callLevel = 0, file = null, line = null) {

    if (php.is_array(content)) {
        content = JSON.stringify(content);
    }

    let time = php.date('Y-m-d H:i:s');
    if (content && content.length > 9000) {
        content = content.substr(0, 9000) + '...';
    }

    if (label !== 'log') {
        content = `【${time}】【${label}】 ${content} `;
    } else {
        content = `【${time}】 ${content} `;
    }


    let func = console[label] || console.log;
    func(content);

    if (recordLog) {
        logs.push(content);
    }
}

function stopRecordLog() {
    recordLog = false;
    return logs;
}

module.exports = {
    debug,
    log,
    warning,
    err,
    error : err,
    startRecordLog,
    stopRecordLog
};
