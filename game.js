const createEngine = require('voxel-engine-stackgl');
const Web3 = require('web3');
var ipfsMethods = require('./utils/ipfs');
var {
    getUsersAssignee,
    getOwnerList,
    getOwnerLands,
    assignLand,
    updateLand
} = require('./utils/ethereum');

const TEST_MODE = true;

function separateChangesOfRegions(regions, chunkSize, changes){
    let regionChanges = new Array(regions.length).fill(0).map(i => ({}));
    for(let chunkId in changes){
        let chunkChanges = changes[chunkId];
        let diff = chunkId.split('_').map(i => (parseInt(i)*chunkSize));
        Object.keys(chunkChanges)
            .map(key => chunkChanges[key])
            .map(({voxel, name}) => {
                let worldPos = [voxel[0]+diff[0], voxel[1]+diff[1], voxel[2]+diff[2]]
                for(let r_i=0 ;r_i<regions.length ; r_i++) {
                    let {x1, y1, x2, y2} = regions[r_i];
                    if(x1<=worldPos[0] && worldPos[0]<=x2 && y1<=worldPos[2] && worldPos[2]<=y2){
                        let key0 = worldPos.join('_');
                        regionChanges[r_i][key0] = {voxel: worldPos, name};
                        break;
                    }
                }
            })
    }
    return regionChanges;
}

function mergeChangesOfRegions(regions, chunkSize, worldChanges) {
    let changes = {};
    for(let region of worldChanges){
        Object.keys(region)
            .map(key => region[key])
            .map(({voxel, name}) => {
                let chunk = voxel.map(n => Math.floor(n/chunkSize));
                let voxel2 = voxel.map(n => n%chunkSize);

                let chunkKey = chunk.join('_');
                let voxelKey = voxel2.join('_');

                if(changes[chunkKey] === undefined)
                    changes[chunkKey] = {};
                if(changes[chunkKey][voxelKey] === undefined)
                    changes[chunkKey][voxelKey] = {}
                changes[chunkKey][voxelKey] = {voxel: voxel2, name}
            })
    }
    return changes;
}

function main(userWallet, userAssignees, worldChanges) {
    console.log('voxelmetaverse starting with user assignees:', userAssignees); // TODO: show git version (browserify-commit-sha)

    var game = createEngine({
        userWallet,
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
            'voxel-materials': require('./plugins/utopia-materials'),
            // 'voxel-land': require('voxel-land'),
            // 'voxel-flatland': require('voxel-flatland'),
            'utopia-land-assign': require('./plugins/utopia-land-assign'),
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
                position: [-4, -90, -4],
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
            'utopia-land-assign': {
                enable: false,
                wallet: userWallet,
                assignees: userAssignees
            }
        }
    });

    document.getElementById('btn-save').addEventListener('click', () => {
        let changes = game.plugins.get('voxel-world-changes').exportChanges();
        let userAssignedRegions = game.plugins.get('utopia-land-assign').getUserAssignedRectangles();

        let changesToSaveInIpfs = separateChangesOfRegions(userAssignedRegions, game.chunkSize, changes);
        console.log('[STA] all regions', userAssignedRegions);
        console.log('[STA] changes of regions', changesToSaveInIpfs);

        let allPromise = [];
        for(let i=0 ; i<userAssignedRegions.length ; i++){
            if(Object.keys(changesToSaveInIpfs[i]).length > 0) {
                allPromise.push(ipfsMethods.save(JSON.stringify({
                    v: '0.0.0',
                    wallet: userWallet,
                    region: userAssignedRegions[i],
                    changes: changesToSaveInIpfs[i]
                })))
            }else {
                allPromise.push(Promise.resolve(undefined));
            }
        }
        Promise.all(allPromise)
            .then(ipfsKeys => {
                console.log('[STA] ipfsKeys after save', ipfsKeys);
                let allIpfsUpdates = [];
                for (let i in ipfsKeys){
                    if(ipfsKeys[i])
                        allIpfsUpdates.push(updateLand(userWallet, ipfsKeys[i], i))
                }
                return Promise.all(allIpfsUpdates);
            })
            .then(res => {
                console.log('[STA] updateLand', res);
                alert('Changes saved into the blockchain successfully')
            })
            .catch(error)


        // // window.localStorage.setItem('voxel-changes', JSON.stringify(changes))

        // Promise.resolve(true)
        //     .then(() => {
        //         return ethereum.enable()
        //     })
        //     // .then(() => {
        //     //     web3.eth.defaultAccount = web3.eth.accounts[0];
        //     // })
        //     .then(() => {
        //         return ipfsMethods.save(JSON.stringify(changes));
        //     })
        //     .then(ipfsId => {
        //         return updateKey(ipfsId)
        //     })
        //     .then(txHash => {
        //         console.log('txHash', txHash);
        //     })
        //     .catch(error => {
        //         console.log(error);
        //         alert(error.message);
        //     })
    })

    document.getElementById('btn-assign-land').addEventListener('click', () => {
        console.log('assigning land to user ...');
        game.plugins.get('utopia-land-assign').toggle();
    })

    game.plugins.get('utopia-land-assign').on('save', rectangles => {
        console.log('[STA] rectangles to save: ', rectangles)
        let allPromise = rectangles
            .filter(r => !r.time)
            .map(({x, y, w, h}) => {
                return assignLand(userWallet, x, y, x+w, y+h);
            })
        Promise.all(allPromise)
            .then(res => {
                window.location.reload();
            })
            .catch(error => {
                console.error('[STA]', error);
            })
    })

    // TODO: hide ui buttons on drain
    game.controls.on('drain', () => {
        console.log('[STA] controls emits drain');
    })
    // TODO: show ui buttons on pause
    game.controls.on('pause', () => {
        console.log('[STA] controls emits pause');
    })
    // game.controls.on('end', () => {
    //     console.log('[STA] controls emits end');
    // })
    // game.controls.on('data', data => {
    //     console.log('[STA] controls emits data', data);
    // })
}

function loadAllIpfsFiles(assignees) {
    let allPromise = []
    for(let wallet in assignees){
        for(let region of assignees[wallet]){
            if(region.ipfsKey)
                allPromise.push(ipfsMethods.getFile(region.ipfsKey))
        }
    }
    return Promise.all(allPromise);
}

function loadChanges() {
    // let web3 = new Web3(window.web3.currentProvider);
    let userWallet = null;
    let userAssignees = {};
    console.log('loading world changes ...');
    // Promise.resolve(true)
    Promise.resolve(true)
        .then(() => {
            return ethereum.enable()
        })
        .then(() => {
            userWallet = web3.currentProvider.selectedAddress;
            console.log('[STA] ethereum enabled: '+ userWallet)
        })
        .then(getOwnerList)
        .then(owners => {
            console.log('[STA] owners', owners);
        })
        .then(() => {
            console.log('[STA] retrieve IPFS key ...')
            return getUsersAssignee();
        })
        .then(assignees => {
            userAssignees = assignees;
            console.log('[STA] total assignees:', assignees);
            console.log('[STA] Looking for IPFS file ...');
            return loadAllIpfsFiles(assignees)
        })
        .then(ipfsFileContents => {
            console.log('[STA] IPFS files contents', ipfsFileContents);
            let worldChanges = ipfsFileContents.map(JSON.parse).map(c => c.changes);
            let changes = mergeChangesOfRegions(userAssignees, 32, worldChanges);
            console.log('[STA] merged ipfs content', changes);
            return changes;
            // if(TEST_MODE){
            //     return ["{}", "{}"];
            // }else{
            //     Promise.all(userAssignees[userWallet].map(rectangle => {
            //         return ipfsMethods.getFile(rectangle.ipfsKey)
            //     }))
            // }
        })
        .catch(error => {
            console.error('[STA]', error);
            return {};
        })
        .then(userChanges => {
            // console.log('file from ipfs', userChangesStr);
            // // TODO: this is array of ipfs files that should be merged
            // let userChanges = {};
            // try{
            //     userChanges = JSON.parse(userChangesStr[0]);
            // }catch (e) {}
            // console.log('World Changes:', userChanges)
            // initGame(userChanges)
            main(userWallet, userAssignees, userChanges);
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

