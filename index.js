const express = require('express');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const shortid = require('shortid');

const app = express();
const { Server } = require('http');
const path = require('path');

const http = new Server(app);
const io = require('socket.io')(http);

const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({ messages: [] }).write();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// __dirname is used here along with package.json.pkg.assets
// see https://github.com/zeit/pkg#config and
// https://github.com/zeit/pkg#snapshot-filesystem
app.use('/', express.static(`${__dirname}/public`));

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/test', (req, res) => {
  res.render('test');
});

app.get('/messages', (req, res) => {
  const messages = db.get('messages').value();
  res.json(messages);
});

app.get('/test-socket', (req, res) => {
  const message = {
    id: shortid.generate(),
    message: 'Message from Test Socket!'
  };
  io.emit('message', message);
  db.get('messages')
    .push(message)
    .write();
  res.json('OK');
});

io.on('connection', socket => {
  console.log('A user connected.');
  socket.on('message', text => {
    const message = { id: shortid.generate(), message: text };
    io.emit('message', message);

    db.get('messages')
      .push(message)
      .write();
  });
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

http.listen(3333, () => console.log('listening on port 3333'));
