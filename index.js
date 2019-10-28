const createEngine = require('voxel-engine-stackgl');
var ipfsMethods = require('./utils/ipfs');
var {updateKey, ipfsKey} = require('./utils/ethereum');

function main(worldChanges) {
    console.log('voxelmetaverse starting'); // TODO: show git version (browserify-commit-sha)

    var game = createEngine({
        exposeGlobal: true, pluginLoaders: {
            'voxel-artpacks': require('voxel-artpacks'),
            'voxel-wireframe': require('voxel-wireframe'),
            'voxel-chunkborder': require('voxel-chunkborder'),
            'voxel-outline': require('voxel-outline'),
            'voxel-carry': require('voxel-carry'),
            'voxel-bucket': require('voxel-bucket'),
            'voxel-fluid': require('voxel-fluid'),
            'voxel-skyhook': require('voxel-skyhook'),
            'voxel-bedrock': require('voxel-bedrock'),
            'voxel-recipes': require('voxel-recipes'),
            'voxel-quarry': require('voxel-quarry'),
            'voxel-measure': require('voxel-measure'),
            'voxel-webview': require('voxel-webview'),
            'voxel-vr': require('voxel-vr'),
            'voxel-workbench': require('voxel-workbench'),
            'voxel-furnace': require('voxel-furnace'),
            'voxel-chest': require('voxel-chest'),
            'voxel-inventory-hotbar': require('voxel-inventory-hotbar'),
            'voxel-inventory-crafting': require('voxel-inventory-crafting'),
            'voxel-voila': require('voxel-voila'),
            'voxel-health': require('voxel-health'),
            'voxel-health-bar': require('voxel-health-bar'),
            //'voxel-health-fall': require('voxel-health-fall'); // TODO: after https://github.com/deathcap/voxel-health-fall/issues/1
            'voxel-food': require('voxel-food'),
            'voxel-scriptblock': require('voxel-scriptblock'),
            'voxel-sfx': require('voxel-sfx'),
            'voxel-flight': require('voxel-flight'),
            'voxel-gamemode': require('voxel-gamemode'),
            'voxel-sprint': require('voxel-sprint'),
            'voxel-decals': require('voxel-decals'),
            'voxel-mine': require('voxel-mine'),
            'voxel-harvest': require('voxel-harvest'),
            'voxel-use': require('voxel-use'),
            'voxel-reach': require('voxel-reach'),
            'voxel-pickaxe': require('voxel-pickaxe'),
            'voxel-hammer': require('voxel-hammer'),
            'voxel-wool': require('voxel-wool'),
            'voxel-pumpkin': require('voxel-pumpkin'),
            'voxel-blockdata': require('voxel-blockdata'),
            'voxel-glass': require('voxel-glass'),
            'voxel-decorative': require('voxel-decorative'),
            'voxel-inventory-creative': require('voxel-inventory-creative'),
            //'voxel-clientmc': require('voxel-clientmc');  // TODO: after published
            'voxel-console': require('voxel-console'),
            'voxel-commands': require('voxel-commands'),
            'voxel-drop': require('voxel-drop'),
            'voxel-zen': require('voxel-zen'),
            'camera-debug': require('camera-debug'),
            'voxel-plugins-ui': require('voxel-plugins-ui'),
            'voxel-fullscreen': require('voxel-fullscreen'),
            'voxel-keys': require('voxel-keys'),
            'kb-bindings-ui': require('kb-bindings-ui'),
            'voxel-player': require('voxel-player'),
            'voxel-world-changes': require('./plugins/voxel-world-changes'),
            'voxel-land': require('./plugins/utopia-land'),
            'voxel-materials': require('./plugins/utopia-materials')
            // 'voxel-land': require('voxel-land'),
            // 'voxel-flatland': require('voxel-flatland'),
        }, pluginOpts: {
            'voxel-engine-stackgl': {
                appendDocument: true,
                exposeGlobal: true,  // for debugging

                texturePath: 'textures/',

                lightsDisabled: true,
                arrayTypeSize: 2,  // arrayType: Uint16Array
                useAtlas: true,
                generateChunks: false,
                chunkDistance: 2,
                worldOrigin: [0, 0, 0],
                controls: {
                    discreteFire: false,
                    fireRate: 100, // ms between firing
                    jumpTimer: 25
                },
                keybindings: {
                    // voxel-engine defaults
                    'W': 'forward',
                    'A': 'left',
                    'S': 'backward',
                    'D': 'right',
                    '<up>': 'forward',
                    '<left>': 'left',
                    '<down>': 'backward',
                    '<right>': 'right',
                    '<mouse 1>': 'fire',
                    '<mouse 3>': 'firealt',
                    '<space>': 'jump',
                    '<shift>': 'crouch',
                    '<control>': 'alt',
                    '<tab>': 'sprint',

                    // our extras
                    'F5': 'pov',
                    'O': 'home',
                    'E': 'inventory',

                    'T': 'console',
                    '/': 'console2',
                    '.': 'console3',

                    'P': 'packs',

                    'F1': 'zen'
                }
            },

            // built-in plugins
            'voxel-registry': {},
            // Stitches a set of block textures together into a texture atlas
            'voxel-stitch': {
                artpacks: [
                    'ProgrammerArt-ResourcePack.zip',
                    // 'Minecraft_Programmer_Art.zip'
                ]
            },
            'voxel-shader': {
                //cameraFOV: 45,
                //cameraFOV: 70,
                cameraFOV: 90
                //cameraFOV: 110,
            },

            'voxel-mesher': {},
            'game-shell-fps-camera': {
                position: [-4, -50, -4],
                rotationY: 0.75 * Math.PI,
            },

            'voxel-artpacks': {},
            'voxel-wireframe': {},
            'voxel-chunkborder': {},
            'voxel-outline': {},
            'voxel-recipes': {},
            'voxel-quarry': {},
            'voxel-measure': {},
            'voxel-webview': {/*url: 'https://google.com'*/},
            'voxel-vr': {onDemand: true}, // has to be enabled after gl-init to replace renderer
            'voxel-carry': {},
            'voxel-bucket': {fluids: ['water', 'lava']},
            'voxel-fluid': {},
            //'voxel-virus': {materialSource: 'water', material: 'waterFlow', isWater: true}, // requires this.game.materials TODO: water
            'voxel-skyhook': {},
            'voxel-bedrock': {},
            'voxel-blockdata': {},
            'voxel-chest': {},
            'voxel-workbench': {},
            'voxel-furnace': {},
            'voxel-pickaxe': {},
            'voxel-hammer': {},
            'voxel-wool': {},
            'voxel-pumpkin': {},

            'voxel-glass': {},
            // Decorative blocks you can craft (list available blocks at bottom of the screen)
            'voxel-decorative': {},
            'voxel-inventory-creative': {},
            //'voxel-clientmc': {url: 'ws://localhost:1234', onDemand: true}, // TODO

            'voxel-console': {},
            'voxel-commands': {},
            'voxel-drop': {},
            'voxel-zen': {},


            // 'voxel-player': {
            //     // image: 'player.png',
            //     homePosition: [0,10,0],
            //     homeRotation: [0,0,0]
            // }, // three.js TODO: stackgl avatar
            'voxel-health': {},
            'voxel-health-bar': {},
            //'voxel-health-fall': {}, // requires voxel-player TODO: enable and test
            'voxel-food': {},
            // A block to run player-defined JavaScript code
            'voxel-scriptblock': {},
            //Play sound effects on events (voxel.js plugin)
            'voxel-sfx': {},
            // Double-tap jump to toggle flight mode, then use jump/crouch to adjust altitude, and land if you hit the ground
            'voxel-flight': {flySpeed: 0.8, onDemand: true},
            'voxel-gamemode': {},
            // Increases voxel-control's max walk speed when forward is double-tapped
            'voxel-sprint': {},
            'voxel-inventory-hotbar': {inventorySize: 10, wheelEnable: true},
            'voxel-inventory-crafting': {},
            'voxel-reach': {reachDistance: 8},
            // using a transparent texture decal for block break progress
            'voxel-decals': {},
            // left-click hold to mine
            'voxel-mine': {
                instaMine: false,
                progressTexturesPrefix: 'destroy_stage_',
                progressTexturesCount: 9
            },
            // right-click to place block (etc.)
            'voxel-use': {},
            // handles 'break' event from voxel-mine (left-click hold breaks blocks), collects block and adds to inventory
            'voxel-harvest': {},
            // Show name of block highlighted at your cursor
            'voxel-voila': {},
            'voxel-fullscreen': {},
            'voxel-keys': {},

            // the GUI window (built-in toggle with 'H')
            //'voxel-debug': {}, // heavily three.js dependent TODO: more debugging options for stackgl-based engine besides camera?
            'camera-debug': {}, // TODO: port from game-shell-fps-camera
            'voxel-plugins-ui': {},
            'kb-bindings-ui': {},
            // 'utopia-land': {},
            'voxel-land': {populateTrees: false},
            'voxel-materials': {},
            // 'voxel-flatland': {block: 'bedrock', onDemand: false},
            'voxel-world-changes': {
                // changes: {'0_0_0': {'0_31_0': {voxel:[0,31,0], name: 'air'}}}
                changes: worldChanges
            },
        }
    });

    document.getElementById('btn-save').addEventListener('click', () => {
        let changes = game.plugins.get('voxel-world-changes').exportChanges();
        // console.log('world changes', changes);
        // // window.localStorage.setItem('voxel-changes', JSON.stringify(changes))
        Promise.resolve(true)
            .then(() => {
                return ethereum.enable()
            })
            .then(() => {
                web3.eth.defaultAccount = web3.eth.accounts[0];
            })
            .then(() => {
                return ipfsMethods.save(JSON.stringify(changes));
            })
            .then(ipfsId => {
                return updateKey(ipfsId)
            })
            .then(txHash => {
                console.log('txHash', txHash);
            })
            .catch(error => {
                console.log(error);
                alert(error.message);
            })
    })
}

function loadChanges() {

    console.log('loading world changes ...');
    // Promise.resolve(true)
    Promise.resolve(true)
        .then(() => {
            return ethereum.enable()
        })
        .then(() => {
            console.log('ethereum enabled')
            web3.eth.defaultAccount = web3.eth.accounts[0];
        })
        .then(() => {
            return ipfsKey();
        })
        .then(ipfsId => {
            console.log('IPFS file id: ', ipfsId);
            console.log('Looking for IPFS file ...');
            return ipfsMethods.getFile(ipfsId)
        })
        .catch(error => {
            console.log('error', error);
            return `{}`;
        })
        .then(userChangesStr => {
            console.log('file from ipfs', userChangesStr);
            let userChanges = {};
            try{
                userChanges = JSON.parse(userChangesStr);
            }catch (e) {}
            console.log('World Changes:', userChanges)
            // initGame(userChanges)
            main(userChanges);
        })
        .catch(error => {
            console.log(error);
            alert(error.message);
        })
}

// in case the document is already rendered
if (document.readyState != 'loading'){
    loadChanges();
}
// modern browsers
else if (document.addEventListener) document.addEventListener('DOMContentLoaded', loadChanges);
// IE <= 8
else document.attachEvent('onreadystatechange', function () {
        if (document.readyState == 'complete') loadChanges();
    });

document.getElementById('connect-ethereum').addEventListener('click', () => {
    if (typeof web3 == 'undefined' || !web3.currentProvider.isMetaMask) {
        alert("MetaMask is not enabled.");
        return;
    }

    function signMsg(msgParams, from) {
        return new Promise(function (resolve, reject) {
            web3.currentProvider.sendAsync({
                method: 'eth_signTypedData',
                params: [msgParams, from],
                from: from,
            }, function (err, result) {
                if (err)
                    reject(err);
                if (result.error) {
                    return reject(result.error)
                }
                resolve(result.result);
            })
        })
    }

    Promise.resolve(true)
        .then(() => {
            return ethereum.enable()
        })
        .then(() => {
            web3.eth.defaultAccount = web3.eth.accounts[0];
        })
        .then(() => {
            let signMessageParams = [
                {
                    type: 'string',      // Any valid solidity type
                    name: 'from',     // Any string label you want
                    value: web3.eth.accounts[0]  // The value to sign
                },
                {
                    type: 'string',      // Any valid solidity type
                    name: 'timestamp',     // Any string label you want
                    value: Date.now().toString()  // The value to sign
                }
            ];
            let from = web3.eth.accounts[0];
            return signMsg(signMessageParams, from)
        })
        .then(depositSignature => {
            console.log('sign', depositSignature);
            alert('done');
        })
});

