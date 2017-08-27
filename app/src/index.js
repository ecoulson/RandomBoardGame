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


let player = {
    name: 'test'    
}

var socket = io();
let players = [player];

socket.emit('getState', createPayload(player))

socket.on('updatePlayers', (payload) => {
    let json = handlePayload(payload);
    players = json;
    let keys = Object.keys(players);
    let playerKey = keys[keys.length - 1];
    player = players[playerKey];
    console.log(player);
});

function emitLevel() {
    player.levelDelta = 1;
    socket.emit('p-updateLevel', createPayload(player));
}