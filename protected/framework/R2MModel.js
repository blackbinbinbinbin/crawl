"use strict"
var Model = require('./Model.js');
var R2M_Client = require('./lib/r2m/Client.js');

class R2MModel extends Model {
    
    constructor(tableName, dbKey, cacheKey) {
        super(tableName, dbKey);
        this.cacheKey = cacheKey || 'default';
        this._getHelper();
    }

    _getHelper() {
        if (!this.objR2m) {
            this.objR2m = new R2M_Client(this.tableName, this.dbKey, this.cacheKey);
        }
        
        return this.objR2m;
    }

    // getRedis() {
    //     return dwRedis::init($this->cacheKey);
    // }    

}
module.exports = R2MModel;
