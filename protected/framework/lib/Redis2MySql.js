"use strict";

var OujRedis = require('./OujRedis.js');
var TableHelper = require('./TableHelper.js');
var r2m_configs = require('../../conf/r2m_config.inc.js');
var php = require('phpjs');
var co = require('co');

/**
 * 基本类，提供增删改查
 * @param {string} dbKey
 * @author benzhan
 */
class Redis2MySql {

    constructor(tableName, dbKey, cacheKey) {
        this.tableName = tableName;
        this.dbKey = dbKey || 'default';
        this.cacheKey = cacheKey || 'default';
        this.cacheInfo = r2m_configs[this.dbKey][tableName];
        if (!this.cacheInfo) {
            throw new Error("redis没配置table name:" + tableName, CODE_REDIS_ERROR);
        }

        /**
         * @type {TableHelper}
         */
        this.objTable = new TableHelper(tableName, this.dbKey);
        /**
         * @type {Redis}
         */
        this.objRedis = OujRedis.init(this.cacheKey);
    }


    /**
     * 获取行的key
     * @param args
     * @returns {string}
     * @private
     */
    _getRowKey(args) {
        var keys = this.cacheInfo['key'].split(',');
        var cacheKeys = [];
        keys.map(function(key) {
            key = key.trim();
            if (args[key]) {
                if (Array.isArray(args[key])) {
                    cacheKeys.push(key + "=" + args[key].join('|'));
                } else {
                    cacheKeys.push(key + "=" + args[key]);
                }
            }
        });

        var cacheKey = this.tableName + ":row";
        if (cacheKey) {
            return cacheKey + ':' + cacheKeys.join(':');
        } else {
            return cacheKey;
        }
    }

    /**
     * 获取getAll的key
     * @param args
     * @returns {string}
     * @private
     */
    _getAllKey(args) {
        var cacheKey = this.tableName + ":all";
        var otherCacheKey = cacheKey + ":others";

        var key = this.cacheInfo['all_key'];
        if (key) {
            var keys = key.split(',');
            var cacheKeys = [];
            keys.map(function(key) {
                key = key.trim();
                if (Array.isArray(args[key]) || typeof args[key] == 'undefined' || args[key] === null) {
                    // 如果有数组，或者有key不存在，则归类到others
                    return otherCacheKey;
                } else {
                    cacheKeys.push(key + "=" + args[key]);
                }
            });

            if (cacheKeys) {
                return cacheKey + ':' + cacheKeys.join(':');
            } else {
                return otherCacheKey;
            }
        } else {
            return otherCacheKey;
        }
    }

    /**
     * 获取一个key的数据
     * @param where
     * @return <NULL, array>
     * @public
     */
    getRow(where) {
        var cacheKey = this._getRowKey(where);
        var that = this;
        return co(function*() {
            var data = yield that.objRedis.hgetall(cacheKey);
            if (php.empty(data)) {
                // 从数据库重建
                var row = yield that.objTable.getRow(where);
                if (!php.empty(row)) {
                    // 设置缓存，无需等待成功就能返回
                    that._setRowCache(row);
                }
                return row;
            } else {
                return data;
            }
        });
    }

    /**
     * 读取多行数据
     * @param where
     * @param keyWord 查询关键字, array('_field', '_where', '_limit', '_sortKey', '_sortDir', '_lockRow', '_tableName')
     * @param updateList 是否强制更新缓存
     * @return array:
     * @public
     */
    getAll(where, keyWord, updateList) {
        var that = this;
        var args = Object.assign({}, where, keyWord);
        var key = php.http_build_query(args);
        if (key.length > 32) {
            key = php.md5(key);
        } else {
            key = php.http_build_query(args);
        }

        return co(function*() {
            var cacheKey = that._getAllKey(where) + ":" + key;
            var data = null;
            if (!updateList) {
                data = yield that.objRedis.get(cacheKey);
                if (data) {
                    return JSON.parse(data);
                }
            }

            data = yield that.objTable.getAll(where, keyWord);

            // 以下内容只是用来同步redis用的，可以异步跳过
            var pipeline = that.objRedis.pipeline();
            pipeline.set(cacheKey, JSON.stringify(data));
            if (that.cacheInfo['ttl'] > 0) {
                pipeline.expire(cacheKey, that.cacheInfo['ttl']);
            }
            pipeline.exec();

            return data;
        });
    }


    /**
     * 增加一行数据
     * @param args
     * @param updateList
     * @return int
     * @public
     */
    addObject(args, updateList) {
        updateList = updateList === false ? updateList : true;
        var that = this;

        return co(function*() {
            var ret = yield that.objTable.addObject(args);
            if (updateList) {
                that.delListCache(args);
            }

            return ret;
        });
    }

    /**
     * 删除列表的缓存
     * @param where
     * @public
     */
    delListCache(where) {
        var that = this;
        var cacheKey = that._getAllKey(where);
        var otherKey = that.tableName + ":all:others";
        return co(function*() {
            var keys = [];
            if (cacheKey === otherKey) {
                // 需要清除所有key删除
                cacheKey = that.tableName + ":all";
                keys = yield that.objRedis.keys(cacheKey + '*');
            } else {
                // 除了删除当前keys，还需要删除others
                keys = yield that.objRedis.keys(cacheKey + '*');
                var keys1 = yield that.objRedis.keys(otherKey + '*');
                keys = Object.assign({}, keys, keys1);
            }

            if (keys.length > 0) {
                that.objRedis.del(keys);
            }

            return 1;
        });
    }

    /**
     * 设置行的缓存
     * @param args
     * @returns {Array|{index: number, input: string}|*|{arity, flags, keyStart, keyStop, step}}
     * @private
     */
    _setRowCache(args) {
        var cacheKey = this._getRowKey(args);
        if (!cacheKey) {
            var msg = "没设置key:cacheKey,".JSON.stringify(this.cacheInfo);
            throw new Error(msg, CODE_REDIS_ERROR);
        }

        var pipeline = this.objRedis.pipeline();
        pipeline.hmset(cacheKey, args);
        if (this.cacheInfo['ttl'] > 0) {
            pipeline.expire(cacheKey, this.cacheInfo['ttl']);
        }

        return pipeline.exec();
    }

    /**
     * 更新行缓存
     * @param args
     * @returns {*}
     * @private
     */
    _updateRowCache(args) {
        var cacheKey = this._getRowKey(args);
        if (!cacheKey) {
            var msg = "没设置key:cacheKey,".JSON.stringify(this.cacheInfo);
            throw new Error(msg, CODE_REDIS_ERROR);
        }

        var that = this;
        return co(function *() {
            var flag = yield that.objRedis.exists(cacheKey);
            if (flag == 1) {
                var pipeline = that.objRedis.pipeline();
                pipeline.hmset(cacheKey, args);

                if (that.cacheInfo['ttl'] > 0) {
                    pipeline.expire(cacheKey, that.cacheInfo['ttl']);
                }

                yield pipeline.exec();

                return 1;
            }
        });
    }


    /**
     * 修改一个key的数据
     * @param args 更新的内容
     * @param where 更新的条件
     * @param updateList
     * @return int 影响行数
     * @public
     */
    updateObject(args, where, updateList) {
        var that = this;
        updateList = updateList === false ? updateList : true;

        return co(function*() {
            var result = yield that.objTable.updateObject(args, where);
            args = php.array_merge(args, where);
            if (result.affectedRows > 0) {
                yield that._updateRowCache(args);

                if (updateList) {
                    that.delListCache(where);
                }
            }

            return result;
        });
    }


    /**
     * 设置一个key的数据
     * @param args
     * @param updateList
     * @return int 影响行数
     * @public
     */
    replaceObject(args, updateList) {
        var that = this;
        return co(function*() {
            var result = yield that.objTable.replaceObject(args);
            yield that._setRowCache(args);

            if (updateList) {
                that.delListCache(args);
            }

            return result;
        });
    }

    /**
     * 删除数据
     * @param where
     * @param updateList
     * @throws RedisException
     * @return unknown
     * @public
     */
    delObject(where, updateList) {
        var that = this;
        updateList = updateList === false ? updateList : true;

        return co(function*() {
            var result = yield that.objTable.delObject(where);

            that._delRowCache(where);
            if (updateList) {
                that.delListCache(where);
            }

            return result;
        });
    }

    /**
     * 删除行的缓存
     * @param where
     * @throws RedisException
     * @private
     */
    _delRowCache(where) {
        var cacheKey = this._getRowKey(where);
        if (!cacheKey) {
            var msg = "没设置key:cacheKey,".JSON.stringify(this.cacheInfo);
            throw new Error(msg, CODE_REDIS_ERROR);
        }

        return this.objRedis.del(cacheKey);
    }

    /**
     * 关闭连接
     * @public
     */
    close() {
        if (this.objTable) {
            this.objTable.close();
        }

        if (this.objRedis) {
            this.objRedis.disconnect();
        }
    }
}

module.exports = Redis2MySql;
