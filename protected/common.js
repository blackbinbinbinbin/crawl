
require('./extensions/function_extend.js');

global['DEFAULT_CHARSET'] = 'utf-8';

global['BASE_DIR'] = __dirname + '/../';
global['ROOT_PATH'] = __dirname + '/';

global['ENV_LOCAL'] = 'local';
global['ENV_DEV'] = 'dev';
global['ENV_FORMAL'] = 'form';
global['ENV_NEW'] = 'new';

let fileName = __filename;
let env = ENV_DEV;
if (fileName.indexOf('/data/webapps/') === 0) {
    if (fileName.indexOf('/test.') !== -1 || fileName.indexOf('/test-') !== -1 || fileName.indexOf('_test/') !== -1) {
        global['CONF_PATH'] = '/data/webapps/conf_v2/test/';
        global['FRAMEWORK_PATH'] = '/data/webapps/framework/nodebase2_test/';
        env = ENV_DEV;
    } else if (fileName.indexOf('/new.') !== -1 || fileName.indexOf('/new-') !== -1 || fileName.indexOf('_new/') !== -1) {
        global['CONF_PATH'] = '/data/webapps/conf_v2/new/';
        global['FRAMEWORK_PATH'] = '/data/webapps/framework/nodebase2_new/';
        env = ENV_NEW;
    } else {
        global['CONF_PATH'] = '/data/webapps/conf_v2/form/';
        global['FRAMEWORK_PATH'] = '/data/webapps/framework/nodebase2/';
        env = ENV_FORMAL;
    }
} else if (fileName.indexOf('/data_dev/') === 0 ) {
    // 内网开发环境
    global['CONF_PATH'] = '/data/webapps/conf_v2/test/';
    global['FRAMEWORK_PATH'] = '/data/webapps/framework/nodebase2_test/';
    env = ENV_DEV;
} else {
    // 本地环境
    global['CONF_PATH'] = ROOT_PATH + '/conf/conf_ns/';
    global['FRAMEWORK_PATH'] = ROOT_PATH + '../../framework/nodebase2/';
    env = ENV_DEV;
}
global['ENV'] = env;

// 公共配置文件
global['GLOBALS'] = require(`${ROOT_PATH}/conf/config.inc.js`);
