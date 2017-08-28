const positions = require('./positions');

function Player(username, i) {
    let id = i;
    let name = username.name;
    let level = 0;
    let inventory = [];
    let gold = 0;
    let pos = positions[level];

    function getName() {
        return name;
    }

    function getGold() {
        return gold;
    }

    function getLevel() {
        return level;
    }

    function getInventory() {
        return inventory;
    }

    function getPosition() {
        return pos;
    }

    function setLevel(l) {
        level = l;
        pos = positions[level];
    }

    function toJSON() {
        return {
            name: getName(),
            gold: getGold(),
            level: getLevel(),
            inventory: getInventory(),
            pos: getPosition(),
            id: id,
        }
    }

    return {
        getName: getName,
        getGold: getGold,
        getLevel: getLevel,
        getInventory: getInventory,
        setLevel: setLevel,
        toJSON: toJSON,
        id: id,
    };
}

module.exports = Player;