"use strict";

let Redis = require('ioredis');
let map = {};

class OujRedis {
    /**
     * 初始化Redis对象
     * @param cacheKey
     * @return {Redis}
     */
    static init(cacheKey) {
        cacheKey = cacheKey || 'default';
        if (!map[cacheKey]) {
            let redisInfo = GLOBALS.redisInfo;
            if (!redisInfo[cacheKey]) {
                console.error('OujRedis can not find ' + cacheKey)
            }
            redisInfo[cacheKey]['lazyConnect'] = true;
            redisInfo[cacheKey]['password'] = redisInfo[cacheKey]['password'] || redisInfo[cacheKey]['pwd'];
            map[cacheKey] = new Redis(redisInfo[cacheKey]);
        }

        return map[cacheKey];
    }

    static async endAll() {
        for (let cacheKey in map) {
            let objRedis = map[cacheKey];
            if (objRedis.status !== 'end') {
                await objRedis.end();
            }
        }
    }
}

module.exports = OujRedis;
