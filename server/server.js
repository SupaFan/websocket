var express = require('express')
var app     = express()
var http    = require('http').Server(app)
var io      = require('socket.io')(http)

// 用户列表
var userList = []

// express 静态资源中间件
app.use(express.static('../static'))

// 聊天室主页面
app.get('/',function(req,res){
  res.sendFile(__dirname + '/index.html')
})

// 上线广播通知
io.sockets.on('connection', socket => {
  socket.on('login', name => {
    console.log(`---------------${name}上线了---------------`);
    // 储存当前登录用户ID
    socket.emit('getSelfId', socket.id)

    // 通知登录
    socket.broadcast.emit('login', name)
    if (userList.indexOf(name) < 0) {
      userList.push({
        name: name,
        id: socket.id
      })
    }
    updataUserList()
  })
})

io.on('connection', (socket) => {
  // 接收消息
  socket.on('chat message', (msg) => {
    io.emit(`getMsg`, msg)
  })

  socket.on('privateMsg', data => {
    io.to(data.sendId).emit(`getPrivateMsg`, data)
    io.to(data.selfId).emit(`selfMsg`, data)
  })


  // 下线通知
  socket.on('disconnect', () => {
    userList.forEach((item, index, arr) => {
      if (item.id === socket.id) {
        arr.splice(index, 1)
        updataUserList()
        console.log(`---------------${item.name}下线了---------------`);
        socket.broadcast.emit('loginOut', item.name)
      }
    })
  })
})


// 更新user列表
let timer
function updataUserList() {
  clearTimeout(timer)
  timer = setTimeout(() => {
    io.sockets.emit('userList', userList)
  }, 300)
}

http.listen(3000, function(){
  console.log('server begin...')
})
