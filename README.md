# websocket 聊天室

### 功能
  
  * 实时聊天
  * 私聊功能
  * 用户列表
  * 上线通知
  * 下线通知
  
  <p align="center">
    <img src="https://github.com/SupaFan/websocket/blob/master/static/img/private.png?raw=true" width=350>
  </p>
 
#### server

```
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

```

#### client

```
<!-- 消息列表 -->
  <ul id="messages"></ul>
  <!-- 推送消息 -->
  <div class="form">
    <i class="myName"></i>
    <input id="msg"  autocomplete="off" /><button id="send">Send</button>
  </div>

  <div class="inputName" style="display: none">
    <div class="msg-layer-bg"></div>
    <div class="msg-layer showAlert">
      <h5>加入聊天室</h5>
      <div class="msg-con">
        <input type="text" maxlength="4" placeholder="请输入您的昵称" class="nickName">
      </div>
      <div class="layer-btn"><input type="button" class="layer-commit" value="Join"></div>
    </div>
  </div>

  <div class="privateDialog" style="display: none">
      <div class="msg-layer-bg"></div>
      <div class="msg-layer showAlert">
        <h5 class="private-title">与大地私聊</h5>
        <div class="msg-con">
          <textarea placeholder="请输入对话内容" class="privateMsg"></textarea>
        </div>
        <div class="layer-btn"><input type="button" class="privateMsg-commit" value="发送"></div>
      </div>
    </div>

  <div class="userList-container">
    <h3>在线列表</h3>
    <ul class="userList">
    </ul>
  </div>
`

`
  $(document).ready(function () {
    toastr.options = {
      "closeButton": true
    }

    var urlParams = function () {
      var url = location.search // 获取url中"?"符后的字串
      url = url.replace('&amp;', '&')
      var param = {}
      if (url.indexOf('?') !== -1) {
        var str = url.substr(1)
        var strs = str.split('&')
        for (var i = 0; i < strs.length; i++) {
          param[strs[i].split('=')[0]] = (strs[i].split('=')[1])
        }
      }
      return param
    }
    var params = urlParams()

    var socket = io(),
        nickName,privateId,selfId,privateName,
        $privateDialog = $('.privateDialog'),
        $msg = $('#msg'),
        $privateMsg = $('.privateMsg'),
        $privateTitle = $('.private-title')
        $send = $('#send'),
        $messages = $('#messages'),
        $inputName = $('.inputName'),
        $body = $('body'),
        $nickName = $('.nickName'),
        $myName = $('.myName'),
        $userList = $('.userList');
        $listContainer = $('.userList-container'),
        $privateMsgCommit = $('.privateMsg-commit')
        dialogShow = false

    function socketIo() {
      $myName.text(nickName)

      // 登录
      socket.emit('login', nickName)

      // 发送消息
      $send.click(function(){
        socket.emit('chat message', {
          name: nickName,
          msg: $msg.val()
        })
        $msg.val('').focus();
        return false;
      });

      // 接收到广播消息
      socket.on('getMsg', returnMsg => {
        $messages.append(`<li>${returnMsg.name}说: ${returnMsg.msg}</li>`)
      })

      // 接受私聊消息
      socket.on('getPrivateMsg', returnMsg => {
        $messages.append(`<li>${returnMsg.name}对您说: ${returnMsg.msg}</li>`)
      })

      // 接受私聊消息
      socket.on('selfMsg', returnMsg => {
        $messages.append(`<li>我对${privateName}说: ${returnMsg.msg}</li>`)
      })


      // 登录广播通知
      socket.on('login', name => {
        toastr.success(`${name}上线了~`, '上线提醒')
        showNotice(name, '上线')
      })


      // 获取自己的id
      socket.once('getSelfId', id => {
        selfId = id
      })

      // 下线广播通知
      socket.on('loginOut', name => {
        toastr.info(`${name}下线了`)
        showNotice(name, '下线')
      })

      // 在线用户列表
      socket.on('userList', userList => {
        var _arr  = []
        userList.forEach(item => {
          _arr.push(`<li data-id="${item.id}">${item.name}</li>`)
        })
        $userList.html(_arr.join(''))
      })
    }

    // 桌面通知
    function showNotice(name, type) {
      Notification.requestPermission(function (perm) {
        if (perm == "granted") {
          var notification = new Notification("上线提醒", {
            dir: "auto",
            lang: "utf-8",
            tag: "testTag",
            icon: "img/icon.png",
            body: `${name}${type}了`,
            renotify: true
          });
        }
      })
    }

    // 输入昵称逻辑
    !function () {
      nickName = localStorage.getItem("nickName")
      if (!nickName) {
        $inputName.show()
      } else {
        socketIo ()
      }
      // 点击发送事件以及回车事件监听
      $body.on('click', '.layer-commit', function(){
        var _val = $nickName.val()
        if (!!$nickName) {
          localStorage.setItem('nickName', _val)
          nickName = _val
          $inputName.hide()
          socketIo()
        }
      })
      // 私聊发送
      .on('click', '.privateMsg-commit', function(){
        socket.emit('privateMsg', {
          name: nickName,
          sendId: privateId,
          selfId: selfId,
          privateName: privateName,
          msg: $privateMsg.val()
        })
        $privateMsg.val('')
        $privateDialog.hide()
        dialogShow = false
      })
      // 键盘回车发送
      .on('keydown', e => {
        if (e.keyCode == 13) {
          if (dialogShow) {
            $privateMsgCommit.trigger('click')
          } else {
            $send.trigger('click')
          }

        }
      })
    }()

    $userList.on('click', 'li', function () {
      var _this = $(this)
      var _id = _this.data('id')
      var _name = _this.text()
      if (_name == nickName) {
        toastr.error('请不要自嗨~')
      } else {
        $privateTitle.text(`与${_name}私聊`)
        dialogShow = true
        privateId = _id
        privateName = _name
        $privateDialog.show()
        $privateMsg.focus()
      }
    })

  });
```
