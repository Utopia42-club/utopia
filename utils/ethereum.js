const Web3 = require('web3');
let _web3=null, _contract=null;

const CONTRACT_ADDRESS = {
    '1': '0x56040d44f407fa6f33056d4f352d2e919a0d99fb', // Main Net
    '3': '0x9344CdEc9cf176E3162758D23d1FC806a0AE08cf', // Ropsten
    '4': '0x801fC75707BEB6d2aE8863D7A3B66047A705ffc0', //'0xe72853152988fffb374763ad67ae577686cefa1a', // Rinkeby
    '5': '', // Goerli
    '42': '', // Kovan
    '56': '',
    '97': '0xF4A32bddD4C85dC175Ce377AEc4AC3FB8d04C9D8'
};
const ABI = require('./abi');

var METAMASK_PROVIDER_LIST = {
    '1': "Ethereum Main Network",
    '3': "Ropsten Test Network",
    '4': "Rinkeby Test Network",
    '5': "Goerli Test Network",
    '42':"Kovan Test Network",
    '56': "Binance Smart Chain",
    '97': "Binance Smart Chain Test"
};

const INFURA_NETWORK_SUBDOMAINS = {
    '1': "mainnet",
    '3': "ropsten",
    '4': "rinkeby",
    '5': "goerli",
    '42':"kovan",
    '56': "bsc",
    '97': "bsctest"
}

const web3ProviderCashe = {};
function getWeb3(networkId) {
    if(INFURA_NETWORK_SUBDOMAINS[networkId] === undefined)
        return null;
    if(web3ProviderCashe[networkId] !== undefined)
        return web3ProviderCashe[networkId];

    var httpProviderLink = `https://${INFURA_NETWORK_SUBDOMAINS[networkId]}.infura.io/v3/b12c1b1e6b2e4f58af559a67fe46104e`;
    var wssProviderLink = `wss://${INFURA_NETWORK_SUBDOMAINS[networkId]}.infura.io/ws`
    if(INFURA_NETWORK_SUBDOMAINS[networkId] == 'bsctest'){
        // testnet
        httpProviderLink = 'https://data-seed-prebsc-1-s1.binance.org:8545';
    }   
    if(INFURA_NETWORK_SUBDOMAINS[networkId] == 'bsc'){
        // mainnet 
        httpProviderLink = 'https://bsc-dataseed1.binance.org:443';
    }
    web3ProviderCashe[networkId] = new Web3(new Web3.providers.HttpProvider(httpProviderLink));
    return  web3ProviderCashe[networkId];
}
var smartContractCashe = {};
function getSmartContract(networkId) {
    if(networkId === undefined){
        networkId = window.ethereum != undefined ? window.ethereum.networkVersion : '1';
        if(web3ProviderCashe[networkId] === undefined)
            web3ProviderCashe[networkId] = new Web3(window.web3.currentProvider);
    }
    if(smartContractCashe[networkId] === undefined){
        const web3 = getWeb3(networkId);
        smartContractCashe[networkId] = new web3.eth.Contract(ABI, CONTRACT_ADDRESS[networkId]);
    }
    return smartContractCashe[networkId];
}

function updateKey(ipfsId) {
    return new Promise(function (resolve, reject) {
        let contract = getSmartContract();
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
        let contract = getSmartContract();
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

function isMetaMaskEnabled(){
    if (typeof window.ethereum == 'undefined' || !window.ethereum.isMetaMask) {
        return false;
    }
    return true;
}

function metaMaskNetworkName(){
    if(!isMetaMaskEnabled())
        return "";
    const networkId = window.ethereum.networkVersion;
    return METAMASK_PROVIDER_LIST[networkId] || "Unknown";
}

function metaMaskUserWallet(){
	if(window.ethereum == undefined)
		return '0xE602D154C00cB2c1570AF23d631191838C0F072a';
    return window.ethereum.selectedAddress;
}

function metaMaskGetUserDataOnOtherNetwork(wallet, networkId) {
    return new Promise(function (resolve, reject) {

    })
}

function getOwnerList(networkId){
    return new Promise(function (resolve, reject) {
        let contract = getSmartContract(networkId);
        contract.methods.getOwners().call((error, response) => {
            if (error)
                reject(error);
            // it returns tx hash because sending tx
            resolve(response);
        });
    })
}

function getLandPrice(x1, y1, x2, y2) {
    return new Promise(function (resolve, reject) {
        let contract = getSmartContract();
        contract.methods.landPrice(x1, y1, x2, y2, ).call((error, price) => {
            if (error)
                reject(error);
            // it returns tx hash because sending tx
            resolve(Web3.utils.fromWei(price).toString());
        });
    })
}

function assignLand(wallet, x1, y1, x2, y2, hash) {
    return new Promise(function (resolve, reject) {
        let contract = getSmartContract();
        contract.methods.landPrice(x1, y1, x2, y2).call((error, amount) => {
            if (error)
                return reject(error);
            //amount = Web3.utils.toWei((Web3.utils.fromWei(amount).toString()*2).toString());
            contract.methods.assignLand(x1, y1, x2, y2, hash || "").send({from: wallet, value: amount}, (error, result) => {
                if (error)
                    return reject(error);
                // it returns tx hash because sending tx
                resolve(result);
            });
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

function getOwnerLand(wallet, landIndex, networkId) {
    return new Promise(function (resolve, reject) {
        let contract = getSmartContract(networkId);
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

function getOwnerLands(wallet, networkId) {
    return new Promise(async function (resolve, reject) {
        let index = 0,
            lands = [],
            isMoreLandToDiscover = true;
        try {
            do {
                console.log(`[STA] getting lands[${index}] ...`);
                let currentLand = await getOwnerLand(wallet, index++, networkId);
                //console.log('[STA] land', currentLand);
                let {x1, y1, x2, y2, time, ipfsKey} = currentLand;
                //console.log('[STA] obj', {x1, y1, x2, y2, time, ipfsKey});
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

function getUsersAssignee(networkId){
    let owners = [];
    console.log(`loading users assignees [${INFURA_NETWORK_SUBDOMAINS[networkId]}]`);
    return getOwnerList(networkId)
        .then(list => {
            console.log('[STA] owners list response', list);
            owners = list;
            return Promise.all(owners.map(wallet => getOwnerLands(wallet, networkId)))
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
    METAMASK_PROVIDER_LIST,
    isMetaMaskEnabled,
    metaMaskNetworkName,
    metaMaskUserWallet,
    updateKey,
    getIpfsKey,
    getUsersAssignee,
    getOwnerList,
    getOwnerLands,
    getLandPrice,
    assignLand,
    updateLand,
};
