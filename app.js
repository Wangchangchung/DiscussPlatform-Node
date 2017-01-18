var express = require('express');
var app = express();
var routes = require("./routes/routes");
var session = require('express-session');

//设置session
//下面的参数很重要，没有设置好，session是会设置不成红的
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

//设置静态模板 本案例使用的是 ejs的模板引擎
app.set('view engine', 'ejs');

// 静态资源的请求路由, 一般是 js css 图片等资源 但是我们本案例的用户
// 头像图片是将它 avatar 中了。
app.use(express.static('./public'));
app.use("/avatar",express.static("./avatar"));

/**
 * 本案例中的请求路由表
 */

//显示首页
app.get('/', routes.showIndex);
//显示注册的页面
app.get('/regist', routes.showRegist);
//做注册的提交  Ajax服务
app.post('/doRegist',  routes.doRegist);
//显示登录的页面
app.get('/login', routes.showLogin);
//做登录的提交   Ajax服务
app.post('/doLogin',  routes.doLogin);
//显示设置头像页面
app.get('/setavatar', routes.showAvator);
//执行设置界面的页面   Ajax服务
app.post('/doSetAvatar', routes.doAvator);
//显示头像图片裁剪的页面
app.get('/cut', routes.showCut);
//显示执行图片的裁剪页面
app.get('/docut', routes.doCut);
//执行发表说说业务
app.post('/post', routes.doPost);
//显示所有的说说
app.get('/showAllComment', routes.showAllComment);
//得到说说的数量
app.get('/getshuoshuoamount', routes.shoushouCount)
//得到用户的信息
app.get('/getUserInfo', routes.getUserInfo);
//显示某个用户的个人说说
app.get('/user/:user', routes.showUser);
//显示某个用户的评论。
app.get('/post/:oid', routes.showUser);
//显示所有用户
app.get('/userlist', routes.showUserList);


app.listen(3000);


