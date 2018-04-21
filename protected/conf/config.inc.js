
let config = require(`${ROOT_PATH}conf/config.${ENV}.inc.js`);

let keys = [
    'globals',
    'code',
    'r2m',
];

for (let name of keys) {
    try {
        let conf = require(`${CONF_PATH}config.${name}.inc.js`);
        config = Object.assign(config, conf);
    } catch(ex) {
        console.error(ex.message);
    }
}

module.exports = config;

// 包含本地配置
