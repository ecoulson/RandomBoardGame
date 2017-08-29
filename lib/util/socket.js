const ioWrapper = require('socket.io');
const Player = require('../game/player.js')

let io;

const state = {
    playerID: 0,
    players: [],
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

    socket.on('getCurrentPlayers', () => {
        io.emit('currentPlayers', createPayload(state.players));
    });

    socket.on('createPlayer', (payload) => {
        let username = handlePayload(payload);
        let player = Player(username, ++state.playerID);
        state.players.push(player);
        io.emit('newPlayerID', createPayload({id: player.id}));
    });
    
}

function handlePlayerUpdates(socket) {
    socket.on('levelUp', (payload) => {
        let json = handlePayload(payload);
        let playerID = json.id;
        for (let i = 0; i < state.players.length; i++) {
            if (playerID == state.players[i].id) {
                state.players[i].setLevel(json.level);
                io.emit('players', createPayload(state.players));
            }
        }
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