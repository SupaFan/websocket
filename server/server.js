var express = require('express')
var app   = express()
var http  = require('http').Server(app)
var io    = require('socket.io')(http)

var userList = []


app.use(express.static('../static'))
app.get('/',function(req,res){
  res.sendFile(__dirname + '/index.html')
})


io.on('connection', (socket) => {
  console.log('---------------有新用户连接进来---------------')
  // 广播消息
  socket.broadcast.emit('hi')

  // 接收消息
  socket.on('chat message', (msg) => {
    io.emit(`getMsg`, msg)
  })

  socket.on('disconnect', () => {
    console.log('================断开连接================');
    userList.forEach((item, index, arr) => {
      if (item.id === socket.id) {
        arr.splice(index, 1)
        updataUserList()
        socket.broadcast.emit('loginOut', item.name)
      }
    })
  })

})
// 上线广播通知
io.sockets.on('connection', socket => {
  socket.on('login', name => {
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
