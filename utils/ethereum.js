const Web3 = require('web3');
let _web3=null, _contract=null;

const CONTRACT_ADDRESS = '0x9344CdEc9cf176E3162758D23d1FC806a0AE08cf';
const ABI = require('./abi');

function getSmartContract() {
    if(!_web3){
        _web3 = new Web3(window.web3.currentProvider);
        _contract = new _web3.eth.Contract(ABI, CONTRACT_ADDRESS);
    }
    return _contract;
}

function updateKey(ipfsId) {
    return new Promise(function (resolve, reject) {
        let contract = web3.eth.contract(ABI).at(CONTRACT_ADDRESS);
        contract.updateKey(ipfsId, (error, txHash) => {
            if (error)
                reject(error);
            // it returns tx hash because sending tx
            resolve(txHash);
        });
    })
}

function getIpfsKey(){
    // let web3 = new Web3(window.web3.currentProvider);

    return new Promise(function (resolve, reject) {
        let contract = web3.eth.contract(ABI).at(CONTRACT_ADDRESS);
        contract.ipfsKey((error, key) => {
            if (error)
                reject(error);
            // it returns tx hash because sending tx
            resolve(key);
        });
    })
}

let lands = {
    "0x7642DBf7ceA81aC5bA4f82Cf04F7670793d3902B": [
        {x1: -50, y1: -60, x2: 50, y2: -10, ipfsKey: null},
    ],
    "0XD6FC222A54746F4BCE90992C35E683CDA0B47C6C": [
        {x1: 0, y1: 0, x2: 20, y2: 30, ipfsKey: "QmSdozEYbzTS4RruFVAD5Z8ugKS3GJqPEF1pY5wyA3nXP8"},
        {x1: 50, y1: 50, x2: 70, y2: 70, ipfsKey: "QmdyaKTcrZSJPxiWbNyTqgQCg9vkBLe3gUnVt3tMvN5vUt"},
    ]
}

function getOwnerList(){
    return new Promise(function (resolve, reject) {
        let contract = getSmartContract();
        contract.methods.getOwners().call((error, response) => {
            if (error)
                reject(error);
            // it returns tx hash because sending tx
            resolve(response);
        });
    })
}

function assignLand(wallet, x1, y1, x2, y2) {
    return new Promise(function (resolve, reject) {
        let contract = getSmartContract();
        contract.methods.assignLand(x1, y1, x2, y2).send({from: wallet}, (error, result) => {
            if (error)
                reject(error);
            // it returns tx hash because sending tx
            resolve(result);
        });
    })
}

function updateLand(wallet, ipfsKey, index) {
    return new Promise(function (resolve, reject) {
        let contract = getSmartContract();
        contract.methods.updateLand(ipfsKey, index).send({from: wallet}, (error, result) => {
            if (error)
                reject(error);
            resolve(result);
        });
    })
}

function getOwnerLand(wallet, landIndex) {
    return new Promise(function (resolve, reject) {
        let contract = getSmartContract();
        contract.methods.getLand(wallet, landIndex).call((error, response) => {
            if (error)
                reject(error);
            // it returns tx hash because sending tx
            let landInfo = {
                x1: parseInt(response.x1),
                y1: parseInt(response.y1),
                x2: parseInt(response.x2),
                y2: parseInt(response.y2),
                time: parseInt(response.time),
                ipfsKey: response.hash,
            }
            resolve(landInfo);
        });
    })
}

function getOwnerLands(wallet) {
    return new Promise(async function (resolve, reject) {
        let index = 0,
            lands = [],
            isMoreLandToDiscover = true;
        try {
            do {
                console.log(`[STA] getting lands[${index}] ...`);
                let currentLand = await getOwnerLand(wallet, index++);
                console.log('[STA] land', currentLand);
                let {x1, y1, x2, y2, time, ipfsKey} = currentLand;
                console.log('[STA] obj', {x1, y1, x2, y2, time, ipfsKey});
                if (currentLand && currentLand.time > 0) {
                    lands.push({x1, y1, x2, y2, time, ipfsKey});
                }else
                    isMoreLandToDiscover = false;
            } while (isMoreLandToDiscover)

            resolve(lands);
        }catch (e) {
            reject(e);
        }
    })
}

function getUsersAssignee(){
    let owners = [];
    return getOwnerList()
        .then(list => {
            console.log('[STA] owners list response', list);
            owners = list;
            return Promise.all(owners.map(wallet => getOwnerLands(wallet)))
        })
        .then(landsOfOwners => {
            let result = {};
            for(let index in owners){
                let wallet = owners[index].toUpperCase();
                result[wallet] = landsOfOwners[index]
            }
            return result;
        })
}

module.exports = {
    updateKey,
    getIpfsKey,
    getUsersAssignee,
    getOwnerList,
    getOwnerLands,
    assignLand,
    updateLand,
};