/**
 * Created by WCC on 2016/12/25.
 */

//引入 进行md5加密的模块
var crypto = require('crypto');
module.exports = function md5(password){
    // 传入的密码进加密， 首先通过  crypto 创建一个md5 对象
    var  md5 = crypto.createHash('md5');
    // 对字符串进行加密
    var safePass = md5.update(password).digest('base64');

    return safePass;
}