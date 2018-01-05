var app   = require('express')()
var http  = require('http').Server(app)
var io    = require('socket.io')(http)

app.get('/',function(req,res){
  res.sendFile(__dirname + '/index.html')
})

io.on('connection', (socket) => {
  console.log('---------------a user connected---------------')

  // 广播消息
  socket.broadcast.emit('hi')

  // 接收消息
  socket.on('chat message', (msg) => {
    console.log(`message: ${msg}`)
    io.emit(`getMsg`, msg)
  })

  socket.on('disconnect', function(){
    console.log('================user disconnected================');
  });
})


http.listen(3000, function(){
  console.log('server begin...')
})
