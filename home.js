document.getElementById('connect-ethereum').addEventListener('click', () => {
    Promise.resolve(true)
        .then(() => {
            return ethereum.enable();
        })
        .then(() => {
            console.log('address: ', web3.currentProvider.selectedAddress);
            if(web3.currentProvider && web3.currentProvider.selectedAddress){
                window.location.href = "/game.html"
            }else{
                throw {message: "MetaMask not connected"}
            }
        })
        .catch(err => {
            if (err.code === 4001) { // EIP 1193 userRejectedRequest error
                console.log('Please connect to MetaMask.')
            } else {
                console.error(err)
            }
        })
});