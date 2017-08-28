function Player(username) {
    let name = username.name;
    let level = 0;
    let inventory = [];
    let gold = 0;
    let pos = {
        x: 10,
        y: -42,
        z: 3,
    }

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
    }

    function toJSON() {
        return {
            name: getName(),
            gold: getGold(),
            level: getLevel(),
            inventory: getInventory(),
            pos: getPosition(),
        }
    }

    return {
        getName: getName,
        getGold: getGold,
        getLevel: getLevel,
        getInventory: getInventory,
        setLevel: setLevel,
        toJSON: toJSON,
    };
}

module.exports = Player;