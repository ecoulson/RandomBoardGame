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
    camera.position.set(0, 0, 100);
    
    const renderer = new THREE.WebGLRenderer();
    
    getPlayer = getPlayer.bind(this);
    getPlayers = getPlayers.bind(this);
    render = render.bind(this);
    drawDeck = drawDeck.bind(this);
    createDeckMeshes = createDeckMeshes.bind(this);
    start = start.bind(this);
    drawCard = drawCard.bind(this);

    const playerGeometry = new THREE.ConeGeometry(1.5, 4.25, 32);
    const boardGeometry = new THREE.BoxGeometry(100, 130, 0.1);
    const cardGeometry = new THREE.BoxGeometry(13,32,0.2);
    const MunckinBoardTexture = new THREE.TextureLoader().load("/src/MunchkinBoard.jpg" );
    const MunckinDoorTexture = new THREE.TextureLoader().load("/src/DoorBack.png");
    const MunckinTreasureTexture = new THREE.TextureLoader().load("/src/TreasureBack.png");
    const boardMaterial = new THREE.MeshPhongMaterial({map: MunckinBoardTexture, shininess: 10, flatShading: THREE.FlatShading });
    const playerMaterial = new THREE.MeshPhongMaterial({color: 0xff0000, shininess: 1, });
    const doorBackMaterial = new THREE.MeshPhongMaterial({map: MunckinDoorTexture});
    const treasureBackMaterial = new THREE.MeshPhongMaterial({map: MunckinTreasureTexture});


    this.state = {
        player: {
            name: 'test',
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
    this.state.players = [this.state.player];
    
    socket.emit('getState', createPayload(this.state.player))
    
    socket.on('updatePlayers', (payload) => {
        let json = handlePayload(payload);
        this.state.players = json;
        this.state.player = this.state.players[json.length - 1];
        createPlayerMeshes();
    });

    window.addEventListener('resize', onWindowResize, false);

    function start() {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setSize( window.innerWidth, window.innerHeight );
        scene.background = new THREE.Color( 0x727882 );
        document.body.appendChild(renderer.domElement);
        
        var light2 = new THREE.DirectionalLight(0xffffff, 0.9, 100);
        light2.position.set(100, 100, 150);
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

        let boardMesh = new THREE.Mesh(boardGeometry, boardMaterial);
        boardMesh.receiveShadow = true;
        scene.add(boardMesh);
        createDeckMeshes(this.state.doorDeck.deck, doorBackMaterial);
        createDeckMeshes(this.state.treasureDeck.deck, treasureBackMaterial);
        createDeckMeshes(this.state.treasureDeck.discard, treasureBackMaterial);
        render();
    }

    function createPlayerMeshes() {
        this.state.playerMeshes = [];
        this.state.players.forEach((player) => {
            let playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
            this.state.playerMeshes.push(playerMesh);
            playerMesh.rotation.x = 90 * Math.PI / 180;
            player.mesh = playerMesh;
            playerMesh.position.x = player.pos.x;
            playerMesh.position.y = player.pos.y;
            playerMesh.position.z = player.pos.z;
            playerMesh.castShadow = true;
            scene.add(playerMesh);
        })
    }

    function createDeckMeshes(deck, material) {
        for (let i = 0; i < deck.size; i++) {
            let cardMesh = new THREE.Mesh(cardGeometry, material);
            deck.meshes.push(cardMesh);
            cardMesh.rotation.z = deck.rotation;
            cardMesh.position.x = deck.pos.x;
            cardMesh.position.y = deck.pos.y;
            cardMesh.position.z = 0.1 * i;
            scene.add(cardMesh);
        }
    }

    function drawDeck(deck, material) {
        
        if (deck.meshes.length != deck.size) {
            for (let i = 0; i < deck.meshes.length; i++) {
                scene.remove(deck.meshes[i]);
            }
            deck.meshes = [];
            createDeckMeshes(deck, material);
        }
    }

    function drawCard(deck) {
        if (deck == 'door') {
            this.state.doorDeck.deck.size--;
        } else {
            this.state.treasureDeck.deck.size--;
        }
    }
    

    function getPlayer() {
        return this.state.player;
    }

    function getPlayers() {
        return this.state.players;
    }

    function render() {
        renderer.render(scene, camera);
        drawDeck(this.state.doorDeck.deck, doorBackMaterial);
        drawDeck(this.state.treasureDeck.deck, treasureBackMaterial);
        drawDeck(this.state.treasureDeck.discard, treasureBackMaterial);
        requestAnimationFrame(render);
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    }

    return {
        player: getPlayer,
        players: getPlayers,
        start: start,
        drawCard: drawCard,
        state: this.state,
    };
})();
game.start();

