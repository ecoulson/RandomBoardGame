function Player(username) {
    let name = username;
    let level = 0;
    let inventory = [];
    let gold = 0;
    let pos = {
        x: 0,
        y: 0,
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

    function setLevel(l) {
        level = l;
    }

    return {
        getName: getName,
        getGold: getGold,
        getLevel: getLevel,
        getInventory: getInventory,
        setLevel: setLevel,
    };
}

module.exports = Player;