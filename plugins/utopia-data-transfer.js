'use strict';
const ethUtil = require('../utils/ethereum');
const EventEmitter = require('events').EventEmitter;
const ever = require('ever');

module.exports = (game, opts) => {
    if (game.isClient) {
        return new DataTransferClient(game, opts);
    } else {
        return new DataTransferCommon(game, opts);
    }
};

module.exports.pluginInfo = {
    loadAfter: ['utopia-land-assign']
};

class DataTransferCommon extends EventEmitter {
    constructor(game, opts) {
        super();
        this.game = game;

        if (!opts) opts = {};

        opts.enable = opts.enable !== undefined ? opts.enable : true;

        this.opts = opts;
    }

    enable() {
    }

    disable() {
    }
}

class DataTransferClient extends DataTransferCommon {
    constructor(game, opts) {
        super(game, opts);

        this.game = game;
        this.assignees = game.plugins.get('utopia-land-assign');

        this.uiData = {
            currentNetwork: ethUtil.metaMaskNetworkName(),
            wallet: ethUtil.metaMaskUserWallet(),
            sourceNetwork: "",
            sourceLands: [],
            allAssignedLands: this.assignees.getAllAssignedLands(),
            sourceDataInProgress: false,
            collisionChecked: false,
            collisionDetected: false
        };

        //this.setSelectedIndex(0); // can't set this early; requires DOM

        // const container = this.createContainer();
        // this.container = container;

        const outerDiv = document.createElement('div');

        outerDiv.style.position = 'fixed';
        outerDiv.style.zIndex = 10;
        outerDiv.style.left = '0';
        outerDiv.style.top = '0';
        outerDiv.style.width = '100%';
        outerDiv.style.height = '100%';
        outerDiv.style.visibility = 'hidden';
        outerDiv.style.transition = 'all 0.5s ease 0s';
        this.outerDiv = outerDiv;

        document.body.appendChild(outerDiv);
        this.updateUI();

        this.enabled = this.opts.enable;
        this.onCancelBtnClick = this.onCancelBtnClick.bind(this);
        this.onSourceNetworkChange = this.onSourceNetworkChange.bind(this);
        this.onDataTransfer = this.onDataTransfer.bind(this);

        if(this.enabled){
            this.enable()
        }
    }
    enable() {
        this.enabled = true;
        this.outerDiv.style.visibility = '';
        this.outerDiv.style.opacity = 1;

        window.addEventListener('utopia-data-transfer-source-changed', this.onSourceNetworkChange)
        window.addEventListener('utopia-data-transfer-transfer', this.onDataTransfer)
        window.addEventListener('utopia-data-transfer-cancel', this.onCancelBtnClick)

        super.enable();
    }
    onCancelBtnClick(){
        this.disable()
    }
    disable() {
        this.enabled = false;
        this.outerDiv.style.visibility = 'hidden';
        this.outerDiv.style.opacity = 0;

        window.removeEventListener('utopia-data-transfer-source-changed', this.onSourceNetworkChange)
        window.removeEventListener('utopia-data-transfer-transfer', this.onDataTransfer)
        window.removeEventListener('utopia-data-transfer-cancel', this.onCancelBtnClick)
        super.disable();
    }
    toggle(){
        this.enabled ? this.disable() : this.enable()
    }
    refresh() {
        // this.refresh();
    }
    onSourceNetworkChange(e) {
        const networkId = e.detail.value;
        console.log("onSourceNetworkChange", ethUtil.METAMASK_PROVIDER_LIST[networkId]);
        this.uiData.sourceNetwork = networkId;
        this.uiData.sourceDataInProgress = true;
        this.uiData.sourceLands = [];
        this.updateUI();

        ethUtil.getOwnerLands(this.uiData.wallet, networkId)
            .then(result => {
                console.log('users lands', result);
                this.uiData.sourceLands = result;
                const allAssignedLands = this.assignees.getAllAssignedLands();

                this.uiData.collisionChecked = true;
                this.uiData.collisionDetected = false;

                for(let wallet of Object.keys(allAssignedLands)){
                    let walletAssignees = allAssignedLands[wallet];
                    for(let assign1 of walletAssignees){
                        for(let assign2 of result){
                            // collision detection
                            if(
                                assign1.x1 < assign2.x2 &&
                                assign1.x2 > assign2.x1 &&
                                assign1.y1 < assign2.y2 &&
                                assign1.y2 > assign2.y1
                            ){
                                this.uiData.collisionDetected = true;
                                return;
                            }
                        }
                    }
                }
            })
            .catch(e => {
                console.error('error happened', e);
            })
            .then(() => {
                this.uiData.sourceDataInProgress = false;
                this.updateUI();
            });
    }
    onDataTransfer(){
        let lands = this.uiData.sourceLands;
        let wallet = this.uiData.wallet;
        Promise.all(lands.map(l => {
            return ethUtil.assignLand(wallet, l.x1, l.y1, l.x2, l.y2, l.ipfsKey);
        }))
            .then(() => {
                alert('Data transferred successfully.')
                window.location.reload();
            })
    }
    updateUI(){
        this.outerDiv.innerHTML = "";
        this.outerDiv.appendChild(this.createDimmer());
        this.container = this.createContainer();
        this.outerDiv.appendChild(this.container);
    }
    createContainer(){
        let container = document.createElement('div');
        container.innerHTML = renderTemplate(this.uiData);
        container.classList.add('disable-scrollbars');
        container.style.display = 'inline-block'
        container.style.position = 'absolute'
        container.style.left = '50%'
        container.style.top = '50%'
        container.style.transform = 'translate(-50%, -50%)';
        container.style.maxHeight = '80%';
        container.style.overflowY = 'scroll';
        container.style.background = 'rgba(0,0,0,0.5)'
        container.style.color = 'white';
        container.style.border = '1px solid white';
        container.style.padding = '0.5em';
        return container;
    }
    createDimmer(){
        let dimmer = document.createElement('div');
        dimmer.style.position = 'absolute'
        dimmer.style.left = '0'
        dimmer.style.top = '0'
        dimmer.style.width = '100%'
        dimmer.style.height = '100%'
        dimmer.style.background = 'black'
        dimmer.style.opacity = '0.8'
        return dimmer;
    }
}

function renderTemplate(data) {
    const sourceComboBoxItems = Object.keys(ethUtil.METAMASK_PROVIDER_LIST)
        .filter(key => key!==data.currentNetwork)
        .map(key => (
            `<option ${(data.sourceNetwork==key ? 'selected' : '')} value="${key}">${ethUtil.METAMASK_PROVIDER_LIST[key]}</option>`
        ));

    const sourceDataProgressBar = data.sourceDataInProgress ? (
        `<div style="margin-bottom: 1em; color: deepskyblue">Loading your data from ${ethUtil.METAMASK_PROVIDER_LIST[data.sourceNetwork]} ...</div>`
    ) : '';

    const landsList = !!data.sourceLands ? (
        data.sourceLands.map(land => (
            `<tr>
                <td>${land.x1}</td>
                <td>${land.y1}</td>
                <td>${land.x2}</td>
                <td>${land.y2}</td>
             </tr>`
        )).join("")
    ) : '';

    let messages = "";
    let transferButton = ""
    let cancelButton = `<div class="btn btn-outline-danger" onclick="window.dispatchEvent(new CustomEvent('utopia-data-transfer-cancel'))">Cancel</div>`

    if(data.sourceLands.length > 0) {
        if (data.collisionChecked) {
            messages = data.collisionDetected
                ?
                "<div style='background: red; color: white'>Your lands has collision with current network assigned lands</div>"
                :
                "<div style='background: green; color: white'>Your can move your game data to current network.</div>";
        }
        if(data.collisionChecked && !data.collisionDetected){
            transferButton = `<div class="btn btn-outline-success" onclick="window.dispatchEvent(new CustomEvent('utopia-data-transfer-transfer'))">Transfer</div>`
        }
    }

    return `
<div style="position: relative; display: flex; flex-direction: column; width: 100%; height: 100%;">
    <div style="flex-grow: 0; padding-bottom: 0.5em">
    </div>
    <div style="position: relative; flex-grow: 1">
        Wallet Address: ${data.wallet}
        <h5 style="margin-bottom: 0">Select source network to copy your data into the ${data.currentNetwork}.</h5>
        <div style="margin-bottom: 1em">
            <select class="form-control" onchange="window.dispatchEvent(new CustomEvent('utopia-data-transfer-source-changed', {detail:{value: this.options[this.selectedIndex].value}}))">
                <option value="">-- Select Network --</option>
                ${sourceComboBoxItems}
            </select>
        </div>
        
        ${sourceDataProgressBar}<br>
        
        <table border="1" cellspacing="0" style="width: 100%; margin-bottom: 1em">
            <tr>
                <td>X1</td>
                <td>Y1</td>
                <td>X2</td>
                <td>Y2</td>
            </tr>
            ${landsList}
        </table>
        ${messages}
        <div style="padding: 0.5em 0">
            ${transferButton}
            ${cancelButton}
        </div>
    </div>
</div>`;
}
