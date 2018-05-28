var express = require('express')
var app   = express()
var http  = require('http').Server(app)
var io    = require('socket.io')(http)

var names = []

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
  })

})
// 上线广播通知
io.sockets.on('connection', socket => {
  socket.on('login', name => {
    console.log(name)
    io.sockets.emit('login', name)
    if (names.indexOf(name) < 0) {
      names.push(name)
    }
    // io.sockets.emit('userList', names)
  })
})


http.listen(3000, function(){
  console.log('server begin...')
})
