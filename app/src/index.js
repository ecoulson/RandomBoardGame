const socket = io();
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

let game = (function() {
    const scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 0, 150);
    document.addEventListener( 'mousedown', handleClick, false );
    
    const renderer = new THREE.WebGLRenderer();
    
    getGameData = getGameData.bind(this);
    render = render.bind(this);
    drawDeck = drawDeck.bind(this);
    createDeckMeshes = createDeckMeshes.bind(this);
    createPlayerMeshes = createPlayerMeshes.bind(this);
    start = start.bind(this);
    drawCard = drawCard.bind(this);
    levelUp = levelUp.bind(this);
    movePlayer = movePlayer.bind(this);
    handleClick = handleClick.bind(this);
    getNonEmptyDecks = getNonEmptyDecks.bind(this);

    const playerGeometry = new THREE.ConeGeometry(1.5, 4.25, 32);
    const boardGeometry = new THREE.BoxGeometry(100, 130, 0.1);
    const cardGeometry = new THREE.BoxGeometry(13,32,0.2);
    const MunckinBoardTexture = new THREE.TextureLoader().load("/src/MunchkinBoard.jpg" );
    const MunckinDoorTexture = new THREE.TextureLoader().load("/src/DoorBack.png");
    const MunckinTreasureTexture = new THREE.TextureLoader().load("/src/TreasureBack.png");
    const boardMaterial = new THREE.MeshPhongMaterial({map: MunckinBoardTexture, shininess: 10, flatShading: THREE.FlatShading });
    const playerMaterial = new THREE.MeshPhongMaterial({color: '#'+Math.floor(Math.random()*16777215).toString(16), shininess: 1, });
    const doorBackMaterial = new THREE.MeshPhongMaterial({map: MunckinDoorTexture});
    const treasureBackMaterial = new THREE.MeshPhongMaterial({map: MunckinTreasureTexture});


    this.state = {
        firstRender: false,
        player: null,
        players: [],
        playerMeshes: {

        },
        doorDeck: {
            deck: {
                cards: [],
                meshes: [],
                rotation: 270 * Math.PI / 180,
                size: 64,
                pos: {
                    x: -29,
                    y: -34.5,
                }
            },
            discard: {
                cards: [],
                meshes: [],
                size: 0,
                rotation: 270 * Math.PI / 180,
                pos: {
                    x: -29,
                    y: -53,
                }
            }
        },
        treasureDeck: {
            deck: {
                cards: [],
                meshes: [],
                size: 64,
                rotation: 90 * Math.PI / 180,
                pos: {
                    x: 29,
                    y: 2,
                }
            },
            discard: {
                cards: [],
                meshes: [],
                size: 0,
                rotation: 90 * Math.PI / 180,
                pos: {
                    x: 29,
                    y: -16.5,
                }
            }
        }
    };

    window.addEventListener('resize', onWindowResize, false);

    function start() {
        getGameData(() => {
            console.log('here');
            setup();
            addLights();
            createPlayerMeshes();
            createBoardMesh();
            render();
            
            socket.on('players', (payload) => {
                let players = handlePayload(payload);
                console.log(players);
                this.state.players = players;
                for (let i = 0; i < players.length; i++) {
                    if (players[i].id == this.state.playerID) {
                        this.state.player = players[i];
                    }
                }
            })
        });
    }

    function getGameData(next) {
        getPlayerID((id) => {
            this.state.playerID = id;
            socket.on('currentPlayers', (payload) => {
                let players = handlePayload(payload);
                this.state.players = players;
                for (let i = 0; i < players.length; i++) {
                    if (players[i].id == this.state.playerID) {
                        this.state.player = players[i];
                    }
                }
                if (!this.state.firstRender) {
                    this.state.firstRender = true;
                    this.state.canRender = true;
                    next();
                }
            });
            socket.emit('getCurrentPlayers');
        });
    }

    function getPlayerID(next) {
        if (window.localStorage.getItem('playerID')) {
            return next(window.localStorage.getItem('playerID'));
        } else {
            let username = { name: 'test' }
            socket.emit('createPlayer', createPayload(username));
        }
        socket.on('newPlayerID', (payload) => {
            let json = handlePayload(payload);
            let id = json.id;
            // window.localStorage.setItem('playerID', id);
            if (!this.state.playerID) {
                return next(id);
            }
        });
    }

    function setup() {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setSize( window.innerWidth, window.innerHeight );
        scene.background = new THREE.Color( 0x727882 );
        document.body.appendChild(renderer.domElement);
    }

    function addLights() {
        var light2 = new THREE.DirectionalLight(0xffffff, 0.9);
        light2.position.set(0, 100, 150);
        light2.castShadow = true;
        light2.shadow.mapWidth = 1024;
        light2.shadow.mapHeight = 1024;
        light2.shadow.mapDarkness = 0.75;
        light2.shadow.cameraNear = 1;
        light2.shadow.cameraFar = 1000;
        light2.shadow.darkness = 0.75;
    
        /* since you have a directional light */
        light2.shadow.camera.left = -300;
        light2.shadow.camera.right = 500;
        light2.shadow.camera.top = 500;
        light2.shadow.camera.bottom = -500;
        scene.add(light2);

        var ambientLight = new THREE.AmbientLight( 0x151515 ); // soft white light
        scene.add( ambientLight );
    }

    function createBoardMesh() {
        let boardMesh = new THREE.Mesh(boardGeometry, boardMaterial);
        boardMesh.receiveShadow = true;
        scene.add(boardMesh);
        createDeckMeshes(this.state.doorDeck.deck, [doorBackMaterial, doorBackMaterial, doorBackMaterial, doorBackMaterial, doorBackMaterial, playerMaterial], 'door');
        createDeckMeshes(this.state.doorDeck.discard, [doorBackMaterial, doorBackMaterial, doorBackMaterial, doorBackMaterial, doorBackMaterial, playerMaterial], 'door');
        createDeckMeshes(this.state.treasureDeck.deck, [treasureBackMaterial, treasureBackMaterial, treasureBackMaterial, treasureBackMaterial, treasureBackMaterial, playerMaterial], 'treasure');
        createDeckMeshes(this.state.treasureDeck.discard, [treasureBackMaterial, treasureBackMaterial, treasureBackMaterial, treasureBackMaterial, treasureBackMaterial, playerMaterial], 'treasure');    
    }

    function createPlayerMeshes() {
        this.state.players.forEach((player) => {
            let playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
            playerMesh.name = player.id;
            playerMesh.rotation.x = 90 * Math.PI / 180;
            playerMesh.position.x = player.pos.x;
            playerMesh.position.y = player.pos.y;
            playerMesh.position.z = player.pos.z;
            playerMesh.castShadow = true;
            scene.remove(this.state.playerMeshes[player.id]);
            this.state.playerMeshes[player.id] = playerMesh;
            scene.add(playerMesh);
        });
    }

    function createDeckMeshes(deck, materials, name) {
        for (let i = 0; i < deck.size; i++) {
            let cardMesh = new THREE.Mesh(cardGeometry, materials);
            deck.meshes.push(cardMesh);
            cardMesh.rotation.z = deck.rotation;
            cardMesh.position.x = deck.pos.x;
            cardMesh.position.y = deck.pos.y;
            cardMesh.position.z = 0.05 * i;
            cardMesh.name = name;
            scene.add(cardMesh);
        }
    }

    function drawDeck(deck) {
        if (deck.meshes.length != deck.size) {
            for (let i = 0; i < deck.meshes.length; i++) {
                scene.remove(deck.meshes[i]);
                deck.meshes.splice(i, 1);
            }
        }
    }

    function drawCard(deck) {
        if (deck == 'door') {
            this.state.doorDeck.deck.size--;
            animateCard(this.state.doorDeck.deck.meshes.pop(), deck, 'youTake');
            return null;
        } else if (deck == 'treasure') {
            this.state.treasureDeck.deck.size--;
            animateCard(this.state.treasureDeck.deck.meshes.pop(), deck, 'youTake');
            return null;
        }
    }
    
    function animateCard(mesh, deckType, animationType) {
        switch (animationType) {
            case 'display':
                if (deckType == 'door') {
                    doorAnimation(mesh);
                } else {
                    treasureAnimation(mesh);
                }
                break;
            case 'otherTake':
                otherPlayerTakeCardAnimation(mesh);
                break;
            case 'youTake':
                if (deckType == 'door') {
                    youTakeDoorCardAnimation(mesh)
                } else {
                    youTakeTreasureCardAnimation(mesh);
                }
                break;
        }
    }

    function doorAnimation(mesh) {
        let interval = setInterval(() => {
            if (mesh.rotation.x < 180 * Math.PI / 180) {
                mesh.rotation.x += 1.5 * Math.PI / 180;
            }
            if (mesh.rotation.z < 360 * Math.PI / 180) {
                mesh.rotation.z += 1 * Math.PI / 180;
            }
            if (mesh.position.y > -80) {
                mesh.position.y += -0.375;
            }
            if (mesh.position.y <= -80 && mesh.rotation.z >= 360 * Math.PI / 180 && mesh.rotation.x >= 180 * Math.PI / 180) {
                clearInterval(interval);
            }
        }, 10);
    }

    function otherPlayerTakeCardAnimation(mesh) {
        let interval = setInterval(() => {
            if (mesh.position.y < 160) {
                mesh.position.y += 1.5;
                mesh.position.x += 0.1;
                mesh.rotation.x += 0.5 * Math.PI / 180;
            }
            if (mesh.position.y >= 160) {
                clearInterval(interval);
            }
        }, 10);
    }

    function youTakeDoorCardAnimation(mesh) {
        let interval = setInterval(() => {
            if (mesh.rotation.x < 180 * Math.PI / 180) {
                mesh.rotation.x += 1.5 * Math.PI / 180;
            }
            if (mesh.rotation.z < 360 * Math.PI / 180) {
                mesh.rotation.z += 1 * Math.PI / 180;
            }
            if (mesh.position.y > -110) {
                mesh.position.y += -1;
            }
            if (mesh.position.y <= -110 && mesh.rotation.z >= 360 * Math.PI / 180 && mesh.rotation.x >= 180 * Math.PI / 180) {
                clearInterval(interval);
            }
        }, 10);
    }

    function youTakeTreasureCardAnimation(mesh) {
        let interval = setInterval(() => {
            if (mesh.rotation.x < 180 * Math.PI / 180) {
                mesh.rotation.x += 1.5 * Math.PI / 180;
            }
            if (mesh.rotation.z < 180 * Math.PI / 180) {
                mesh.rotation.z += 1 * Math.PI / 180;
            }
            if (mesh.position.y > -110) {
                mesh.position.y += -1;
            }
            if (mesh.position.y <= -110 && mesh.rotation.z >= 180 * Math.PI / 180 && mesh.rotation.x >= 180 * Math.PI / 180) {
                clearInterval(interval);
            }
        }, 10);
    }

    function treasureAnimation(mesh) {
        let interval = setInterval(() => {
            if (mesh.rotation.x < 180 * Math.PI / 180) {
                mesh.rotation.x += 1.5 * Math.PI / 180;
            }
            if (mesh.rotation.z < 180 * Math.PI / 180) {
                mesh.rotation.z += 1 * Math.PI / 180;
            }
            if (mesh.rotation.z >= 180 * Math.PI / 180 && mesh.rotation.x >= 180 * Math.PI / 180) {
                clearInterval(interval);
            }
        }, 50);
    }

    function getPlayer() {
        return this.state.player;
    }

    function getPlayers() {
        return this.state.players;
    }

    function render() {
        if (this.state.canRender) {
            movePlayer();
            drawDeck(this.state.doorDeck.deck);
            drawDeck(this.state.doorDeck.discard);
            drawDeck(this.state.treasureDeck.deck);
            drawDeck(this.state.treasureDeck.discard);
            renderer.render(scene, camera);
        }
        requestAnimationFrame(render);
    }

    function levelUp(l) {
        this.state.player.level += l;
        if (this.state.player.level > 10) {
            this.state.player.level = 10;
        }
        if (this.state.player.level < 0) {
            this.state.player.level = 0;
        }
        console.log(createPayload(this.state.player));
        socket.emit('levelUp', createPayload(this.state.player));
    }

    function movePlayer() {
        if (this.state.players.length > Object.keys(this.state.playerMeshes).length) {
            createPlayerMeshes();
        }
        this.state.players.forEach((player) => {
            let mesh = this.state.playerMeshes[player.id];
            mesh.position.x = player.pos.x;
            mesh.position.y = player.pos.y;
            mesh.position.z = player.pos.z;
        })
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    function handleClick(event) {
    
        event.preventDefault();
    
        var vector = new THREE.Vector3(
            ( event.clientX / window.innerWidth ) * 2 - 1,
          - ( event.clientY / window.innerHeight ) * 2 + 1,
            0.5
        );

        vector.unproject(camera);
    
        var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
    
        var intersects = ray.intersectObjects(getNonEmptyDecks());
    
        if (intersects.length > 0) {
            drawCard(intersects[0].object.name);
        }
    }

    function getNonEmptyDecks() {
        let nonEmpty = [];
        if (this.state.doorDeck.deck.size != 0) {
            nonEmpty.push(this.state.doorDeck.deck.meshes[this.state.doorDeck.deck.size - 1]);
        }
        if (this.state.treasureDeck.deck.size != 0) {
            nonEmpty.push(this.state.treasureDeck.deck.meshes[this.state.treasureDeck.deck.size - 1]);
        }
        return nonEmpty;
    }

    return {
        player: getPlayer,
        meshs: this.state.playerMeshes,
        players: getPlayers,
        start: start,
        drawCard: drawCard,
        state: this.state,
        levelUp: levelUp,
    };
})();
game.start();

