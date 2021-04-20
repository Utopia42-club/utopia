const ipfsClient = require('ipfs-http-client')
// const ipfs = ipfsClient('/ip4/159.65.160.34/tcp/5001')
//const ipfs = ipfsClient('/ip4/165.227.29.137/tcp/5001')
const ipfs = ipfsClient({host: 'utopia42.club', port:443, protocol:'https'})
// const ipfs = ipfsClient('/ip4/127.0.0.1/tcp/5001')

const TEST_MODE = false;

function save(data) {
    if (TEST_MODE) {
        return Promise.resolve('QmQNXSc9EEKGb7QTTvEKHR1YqpwHuHKDRARQF2Y5MxZSAd')
    } else {
        return Promise.resolve(true)
            .then(() => {
                const buffer = ipfsClient.Buffer;
                return buffer.from(data);
            })
            .then(bufferedString => {
                return ipfs.add(bufferedString)
            })
            .then(response => {
                console.log('IPFS add response', response);
                let ipfsId = response[0].hash;
                return ipfsId;
            })
    }
}

function getFile(ipfsId) {
    if (TEST_MODE) {
        Promise.resolve("{}")
    } else {
        return ipfs.cat(`/ipfs/${ipfsId}`)
            .then(file => {
                return file.toString('utf8');
            })
    }
}

module.exports = {
    save,
    getFile
}