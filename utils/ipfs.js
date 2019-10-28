const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient('/ip4/127.0.0.1/tcp/5001')

function save(data){
    // return Promise.resolve('QmQNXSc9EEKGb7QTTvEKHR1YqpwHuHKDRARQF2Y5MxZSAd')

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

function getFile(ipfsId){
    return ipfs.cat(`/ipfs/${ipfsId}`)
        .then(file => {
            return file.toString('utf8');
        })
}

module.exports = {
    save,
    getFile
}