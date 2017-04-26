/**
 * Created by WCC on 2016/12/23.
 */

//  这个模块里面，我们封装了所有的对数据库的常用操作
var MongoClient = require('mongodb').MongoClient;

var settings = require('../settings.js');

//不管数据库的什么操作，都是先连接数据库，所以我们可以把
//数据库封装成内部函数  加上了 _  就表示的是内部函数
function _connectDB(callback) {
    // 从settings文件中读取数据库的连接路径
    var url = settings.dburl;
    
    //连接数据库
    MongoClient.connect(url, function(err, db){
        if (err){
            callback(err, null);
            return ;
        }
        callback(err, db);
    });
};

//插入数据
exports.insertOne = function (collectionName, json, callback) {
    _connectDB(function (err, db) {
        db.collection(collectionName).insertOne(json, function (err, result) {
           callback(err, result);
            //关闭数据库
           db.close();
        });
    });
};

// 查找数据

exports.find = function (collectionName, json, C , D) {
    // 用于存放结果集的数组
    var result  = [];
    if(arguments.length == 3) {
        //如果参数是3个, 那么的话，C就是回调函数
        var callBack = C;
        var skipNumber = 0;
        var limit = 0;
    }else if(arguments.length == 4){
        var callBack = D;
        var args = C;
        //应该省略的条数
        var skipNumber = args.pageamount * args.page || 0;
        // 数目限制
        var limit = args.pageamount || 0;
        // 排序方式
        var sort = args.sort || {};
    }else {
        throw  new Error('find  函数的参数个数，必须是3个或者4个');
        return;
    }

    _connectDB(function (err, db) {
        //因为在_connectDB中已经处理的err， 并调用回调函数，所以我们这里就是
        //传来的 err  是不包含错误的，所以可以直接使用db了
        // 进行分页查询
        var cursor = db.collection(collectionName).find(json).skip(skipNumber).limit(limit).sort(sort);
        
        cursor.each(function (err, doc) {
            if(err){
                callBack(er, null);
                // 出错了就要关闭数据库
                db.close();
                return ;
            }
            if(doc != null){
                //将文档放入到数组中
                result.push(doc);
            }else {
                //遍历结束，没有更多的文档了，那就返回
                callBack(null, result);
                db.close();//关闭数据库
            }
        });
    });
}

// 删除

exports.deleteMany = function (collectionName, json, callback) {
    _connectDB(function (err, db) {
       db.collection(collectionName).deleteMany(json, function (err, result) {
            console.log(result) ;
            callback(err, result);
            db.close(); //关闭数据库
       });
    });
}

// 修改， 第一个参数是 集合的名字， 第二个参数是 修改条件，第三个是 修改内容 ，第四个是修改回调函数
exports.updateMany =  function (collectionName, json1, json2 ,callback) {
    _connectDB(function (err, db) {

        db.collection(collectionName).updateMany(json1, json2,  function (err, result) {
            callback(err, result);
            db.close();
        });
    });
}

// 查找数据库记录

exports.getAllCount = function (collectionName, callback) {
    _connectDB(function (err, db) {
        db.collection(collectionName).count({}).then(function (count) {
            callback(count);
            db.close();
        });
    });
}















