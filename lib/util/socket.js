const ioWrapper = require('socket.io');
const Player = require('../game/player.js')

let io;

const state = {
    playerID: 0,
    players: {},
    connections: [],
}

module.exports = (httpServer) => {
    io = ioWrapper(httpServer);
    io.on('connection', (socket) => {
        handleConnection(socket);
        handlePlayerUpdates(socket);
    });
}

function handleConnection(socket) {
    console.log('User connected');
    state.connections.push(socket);

    socket.on('getState', function handleTest(payload) {
        state.playerID++;
        let username = handlePayload(payload);
        let player = Player(username);
        player.id = state.playerID;
        state.players[player.id] = player;
        io.emit('updatePlayers', createPayload(state.players));
        console.log(state.players);
    });

    socket.on('disconnect', () => {
        console.log('remove request')
        let index = state.connections.indexOf(socket);
        state.connections.splice(index, 1);
        let keys = Object.keys(state.players);
        let key = keys[index];
        delete state.players[key];
    });
}

function handlePlayerUpdates(socket) {
    socket.on('p-updateLevel', (payload) => {
        let json = handlePayload(payload);
        let playerID = json.id;
        let level = state.players[playerID].getLevel() + json.levelDelta;
        state.players[playerID].setLevel(level);
    });
}

function handlePayload(payload, next) {
    try {
        if (next) {
            return next(JSON.parse(payload));
        }
        return JSON.parse(payload);
    } catch (e) {
        console.error(e);
    }
}

function createPayload(json) {
    try {
        return JSON.stringify(json);
    } catch (e) {
        console.error(e);
    }
}