const Web3 = require('web3');


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

function ipfsKey(){
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

module.exports = {
    updateKey,
    ipfsKey
};

const CONTRACT_ADDRESS = '0x8737F0A2F886bB250e220272D4185B2cc40513A2'
const ABI =
    [
        {
            "constant": true,
            "inputs": [],
            "name": "ipfsKey",
            "outputs": [
                {
                    "name": "",
                    "type": "string"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "time",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "adminWallet",
            "outputs": [
                {
                    "name": "",
                    "type": "address"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "payable": true,
            "stateMutability": "payable",
            "type": "fallback"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "name": "ipfsKey",
                    "type": "string"
                },
                {
                    "indexed": false,
                    "name": "time",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "name": "wallet",
                    "type": "address"
                }
            ],
            "name": "UpdateEvent",
            "type": "event"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_ipfsKey",
                    "type": "string"
                }
            ],
            "name": "updateKey",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ]