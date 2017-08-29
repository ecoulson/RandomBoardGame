const express = require('express');
const app = express();
const http = require('http').Server(app);
const path = require('path');

const SocketAPI = require('./lib/util/socket');

const gamePagePath = path.join(__dirname, 'app', 'index.html');
const port = process.argv[2];

app.use(express.static(path.join(__dirname, 'app')));

app.get('/', (req, res) => {
    res.sendFile(gamePagePath);
});

http.listen(process.env.PORT || port || 8080, (req, res) => {
    console.log(`Listening on ${port}`);
    SocketAPI(http);
});