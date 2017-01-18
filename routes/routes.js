//本案例中所需要的 node_modules
var formidable = require('formidable');
var path = require('path');
var fs  = require('fs');
var gm = require('gm');

//引入自己写的 modules
var db = require('../model/db')
var md5 = require('../model/md5');

//显示首页的界面
exports.showIndex = function (req, res, next) {
    // 如果是登录，取得登入的用户名
    if(req.session.login == '1'){
        var userName = req.session.username;
        var login = true;
    }else{
        // 没有登录，构造一个空的用户名
        var userName = '';
        var login = false;
    }
    /*
        从数据库中进行查找用户的信息，获取用户的图像头像字符串
        参数1： 用户表
        参数2：查询条件为 session 中的username
        参数3：回调函数
     */
    db.find('users', {'userName': userName}, function (err, result) {
        //服务器出现异常，查找出错
        if(err){
            res.send('-3');
            return;
        }
        //console.log('图片的结果是:' + result.length);

        //用户的头像名称
        var avatar;
        if(result.length == 0){
            //用户数据库中没有，使用默认的头像名称
            avatar = 'moren.jpg';
        }else {
            //使用用户自己设置的图片名称
            avatar = result[0].avatar;
        }
        //console.log('现在的头像是:' + avatar);

        //将这些信息携带进入 首页的模板引擎中。
        res.render('index', {
            'login':login,
            'username': userName,
            'active': '首页',
            'avatar':avatar
        });
    });
};

// 显示注册的页面
exports.showRegist = function (req, res, next) {
    /*
       渲染注册页面
    */
    res.render('regist', {
        'login': req.session.login == '1' ? true : false,
        'username':req.session.login == '1'?  req.session.username:'',
        'active' : '注册'
        });
};

// 执行注册的业务
exports.doRegist  = function (req, res, next) {
    // 判断是否是 执行注册操作，并且是否是 post请求
    if (req.url == '/doRegist' && req.method.toLowerCase() == 'post') {
        // 创建formidable对象
        var form = new formidable.IncomingForm();
        // 使用对象进行解析
        form.parse(req, function (err, fields, files) {
        // 得到表单之后,取得提交的数据
        var userName = fields.username;
        var password = fields.password;

        // 从数据库中查找用户名是否已经被使用
        db.find('users',{'userName': userName}, function (err, result) {
             //服务器出现错误
             if(err){
                  res.send('-3');
                  return;
             }
             //用户名已经被占用了
             if(result.length != 0){
                  res.send('-1');
                  return;
             }
             //可以进行注册，多次对md5进行加密
             var safePass = md5(md5(password) + "wcc");
             /*
                向users表中插入用户的信息，注册的初始头像的信息使用默认的头像
              */
             db.insertOne('users',
                    {'userName': userName, 'passWord': safePass, 'avatar':'moren.jpg'},
                    function(err, result) {
                        if(err){
                             res.send('-3');
                             return;
                        }
                        // 注册成功 写入session
                        req.session.login = '1';
                        req.session.username = userName;
                        // 向前端页面发送成功的信号
                        res.send('1');
                });
          });
      });
    }
};

//显示的登录的页面
exports.showLogin = function (req, res, next) {
    /*
       渲染登录的页面
     */
    res.render('login', {
        'login': req.session.login == '1' ? true  : false,
        'username' : req.session.login == '1' ? req.session.username : '',
        'active':'登录'
    });
};

//执行登录的业务  ajax 服务
exports.doLogin = function (req, res, next) {
    // 执行登录的操作， 判断是否是执行登录的并且是post操作
    if (req.url == '/doLogin' && req.method.toLowerCase() == 'post') {
        // 创建表单对象
        var form = new formidable.IncomingForm();
        //对表单进行解析
        form.parse(req, function (err, fields, files) {
            // 从表单中，得到提交的数据
            var userName = fields.username;
            var password = fields.password;
            // 从数据库中查找是否用改用户
            db.find('users',{'userName': userName}, function (err, result) {
                //服务器出现错误
                if(err){
                    res.send('-3');
                    return;
                }
                //用户名不存在
                if(result.length == 0){
                    res.send('-1');
                    return;
                }
                //使用用户的密码进行MD5 加密
                var safePass = md5(md5(password) + "wcc");
                //加密后的密码与数据库中的密码进行比对
                if(safePass == result[0].passWord){
                    // 将session 进行写入
                    req.session.login = '1';
                    req.session.username = userName;
                    res.send('1');
                    return;
                }else {
                    // 密码错误
                    res.send('-2');
                    return;
                }
            });
        });
    }
};

//显示设置头像的业务
exports.showAvator = function (req, res, next) {
    //要进行信息的修改，必须是要保证有登入的状态
    if(req.session.login != '1'){
        // 这里可以将页面转向 404 页面！
        req.end('你在非法闯入，你知道了吗？！');
        return;
    }
    /*
        渲染 设置用户头像的页面
     */
    res.render('setavatar', {
        'login':  true,
        'username': req.session.username  || '',
        'active':'修改头像'
    });

};

//执行 设置头像的业务 ajxj
exports.doAvator =  function (req, res, next) {
    //console.log('我们设置好了这写的东写了');

    //判断是否是执行 设置用户头像的操作，并且用户的提交类型是post
    if (req.url == '/doSetAvatar' && req.method.toLowerCase() == 'post') {

        var form = new formidable.IncomingForm();
        // 设置好文件(图片)的上传路径，本案例设置的是在工程下的avatar文件夹
        form.uploadDir = path.normalize(__dirname + '/../avatar');

        //console.log('__dirname的路径是：' + __dirname);
        //F:\Code\IDEA\Node\NodeComment\routes
        //console.log('我设置的上传的的路径是：' + form.uploadDir);
        //F:\Code\IDEA\Node\NodeComment\avatar

        form.parse(req, function (err, fields, files) {

            // 从表单中提取出用户提交的头像
            var oldPath = files.touxiang.path;

            //console.log('文件的老的路径是:' + oldPath);
            //F:\Code\IDEA\Node\NodeComment\avatar\upload_3899e5756dbe77e4f6bd60a69df7e4c4

            // 新的文件路径是 在 avatar 下，并且设置头像的名称就是用户的用户名，保证了唯一性
            var  newPath = path.normalize(__dirname + '/../avatar/' + '/' +
            req.session.username  + '.jpg');

            //console.log('文件的新的路径是:' + newPath);
            //例如 ：F:\Code\IDEA\Node\NodeComment\avatar\111.jpg

            // 千万要注意的是 不要用 files去执行改名的操作，应该是 fs 去执行改名的操作
            fs.rename(oldPath, newPath, function (err) {
               //改名出现错误
                if(err){
                   res.send('服务器出现异常！请你们稍后再进行');
                   return ;
               }
               // 将sessio填入
               req.session.avatar = req.session.username + '.jpg';
               //跳转到切图的界面
                res.redirect('/cut');
            });
        });
    }
};

// 显示执行图片执行的
exports.showCut  = function (req, res, next){
    // 这里要先判断是否是登入的状态。
    if(req.session.login != '1'){
        res.send('该页面必须先登录，请先登录后再访问！');
        return;
    }

    // 我们将session中的avator 传入到界面中，使得切图的图片就是用户头像的图片
    res.render('cut', { 'avatar': req.session.avatar});
};

// 显示执行裁剪图片的
exports.doCut = function (req, res, next) {
    //对是否是登录状态进行判断
    if(req.session.login != '1'){
        res.send('该页面需要登录，请先登录后再进行访问！');
        return;
    }
    // 裁剪的图片的宽
    var wide = req.query.w;
    // 裁剪的图片的高
    var high  = req.query.h;
    // 截取的图片距离原图片的距离 x坐标
    var  x = req.query.x;
    //截取的图片距离原图片的距离 y坐标
    var y = req.query.y;
    // 从session 中获取头像文件名
    var filename = req.session.avatar;
    // 使用gm对图片进行裁剪图片了
    gm('./avatar/' + filename)
        .crop(wide, high, x, y)
        .resize(100, 100, "!")// 将图片变成宽 高都为 100的图片，‘1’表示的是不按照宽和高的比例进行
        .write('./avatar/' + filename, function (err) {
            //出现错误的时候
            if(err){
                res.send('-1');
                return;
            }

            //修改成功了，就将数据库中的 图片的名称更改为 新的名称
            // 参数： 数据库集合名称  修改条件   要修改的值  回调函数
            db.updateMany('users', {'userName': req.session.username},
                {$set:{'avatar':req.session.avatar}},
                function (err, result) {
                    if(err){
                        res.send('服务器出现异常！');
                        return;
                    }
                    // 数据修改成功
                    res.send('1');
                });
        });
};

//显示发表说说 的业务
exports.doPost = function (req, res, next) {
    //判断是登录的状态
    if(req.session.login != '1'){
        res.end('非法闯入！该页面必须要求登录！');
        return;
    }

    // 判断是 post的路由，并且是post的请求
    if (req.url == '/post' && req.method.toLowerCase() == 'post') {
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            //得到用户发说说的内容
            var content = fields.content;
            //从session 中得道用户名
            var username = req.session.username;

            /*
             现在可以将数据插入到数据库posts 说说集合中了
             参数1： 集合的名称post
             参数2：插入的JSON ： 用户名，日期，说说的内容
             参数3：回调函数
             */
            db.insertOne('posts',
                {'username': username,'datatime': new Date(),'content': content},
                function (err, result) {
                    if(err){
                        // 服务器出错
                        res.send('-3');
                        return;
                    }
                    // 注册成功
                    res.send('1');
                }
            );
        });
    }
};

//显示所的说说评论  使用 ajax服务
exports.showAllComment = function (req, res, next) {
    // 取得请求的参数
    var  page = req.query.page;
    // 从数据库中的 posts 集合进行分页的查找
    /*
        参数1： posts 集合进行查找
        参数2： 查找的JSON条件  {每页的文档条数， 第几页， 是否是执行排序}
        参数3： 回调函数
     */
    db.find('posts', {},
        {
            'pageamount': 9,
            'page': page,
            'sort':{'datetime': -1}
        },function (err, result) {
            if(err){
                res.send('服务器出现异常！ 请咨询管理员');
                return ;
            }
            // 向前台的页面中发送json数据。
            //console.log(result);
            res.json(result);
        });
};

// 显示出数据库中的说说的数量
exports.shoushouCount = function (req, res, next){
    //从posts集合中查找所有的说说总数
    db.getAllCount('posts', function (count) {
        //console.log('数据库的说说总数是：' + count);
        res.send(count.toString());
    });
};

// 从数据库中查询某一个用户的信息  根据的是 username 进行查询
exports.getUserInfo = function (req, res, next) {
    var username = req.query.username;

    db.find('users', {'userName': username}, function (err, result) {
        // 如果不存在会出现错误，就发送一个空JSON
       if(err|| result.length == 0){
            res.json('');
            return ;
       }
       /*
         构造一个json 对象，传递给前台页面
         { 用户名，用户的头像， 用户的注册id }
       */
       var obj = {
           'username': result[0].userName,
           'avatar': result[0].avatar,
           '_id': result[0]._id
       };
       // 向前台发送json数据
       res.json(obj);
    });
};

// 显示某一个用户的个人主页
exports.showUser = function (req, res, next) {

     var user = req.params['user'];
    db.find('posts', {'username':user}, function (err, result) {
         db.find('users', {'userName': user},function (err, result2) {
         /*
            渲染user模板引擎
            JSON数据{是否登录，用户名，user， actvie，说说集合，用户头像}
          */
         res.render('user', {
             'login' : req.session.login =='1' ? true: false,
             'username':  req.session.login == '1' ? req.session.username :'',
             'user' : user,
             'active': '我的说说',
             'cirenshuoshuo':result,
             'cirentouxiang' : result2[0].avatar
         });
     });
  });
};

// 显示所有的用户列表
exports.showUserList = function (req, res, next) {
        db.find('users', {}, function (err, result) {

           //console.log('所有的成员列表：' + result.length);
            /*
                渲染userlist模板引擎，
                JSON {是否是登录， 用户名， active， 成员列表}
            */
           res.render('userlist', {
               'login': req.session.login =='1' ? true : false,
               'username' : req.session.login =='1' ?  req.session.username : '',
               'active':'成员列表',
               'suoyouchengyuan': result
           });
        });
};





