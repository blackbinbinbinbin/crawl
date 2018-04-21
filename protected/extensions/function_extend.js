/**
 * Created by benzhan on 15/8/25.
 */
let php = require('phpjs');

function getServerIp() {
    let os = require('os');
    let ipv4;
    let net = os.networkInterfaces();
    let en0 = net.en0 || net.eth0;
    if (en0) {
        for (let i = 0; i < en0.length; i++) {
            if (en0[i].family.toLowerCase() == 'ipv4') {
                ipv4 = en0[i].address;
            }
        }
    }

    return ipv4 || '127.0.0.1';
}

function getClientIp(_req) {
    let ip = _req.headers['x-forwarded-for'] ||
        _req.connection.remoteAddress ||
        _req.socket && _req.socket.remoteAddress ||
        _req.connection.socket && _req.connection.socket.remoteAddress;

    let parts = ip && ip.split(':');
    if (parts && parts.length) {
        return parts[parts.length - 1];
    } else {
        return '';
    }
}

function checkIpRange(remote_ip, ip_array){
    //判断ip是否在白名单
    for (let i in ip_array) {
        let ip = ip_array[i];
        let ip_info = ip.split('/');
        let mask = ip_info[1] ? ip_info[1] : 32;

        let ip_mask = php.sprintf("%032b", php.ip2long(ip_info[0])).substr(0, mask);
        let remote_ip_mask = php.sprintf("%032b", php.ip2long(remote_ip)).substr(0, mask);
        if (ip_mask === remote_ip_mask) {
            return true;
        }
    }

    return false;
}

global['getServerIp'] = getServerIp;
global['getClientIp'] = getClientIp;
global['checkIpRange'] = checkIpRange;

