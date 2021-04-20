'use strict';

const EventEmitter = require('events').EventEmitter;
const ever = require('ever');
const {GraphPaper, Mouse} = require('../components/graph-paper')

module.exports = (game, opts) => {
    if (game.isClient) {
        return new LandAssignClient(game, opts);
    } else {
        return new LandAssignCommon(game, opts);
    }
};

module.exports.pluginInfo = {
    loadAfter: []
};

class LandAssignCommon extends EventEmitter {
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

class LandAssignClient extends LandAssignCommon {
    constructor(game, opts) {
        super(game, opts);

        this.game = game;
        this.assignees = this.opts.assignees;
        console.log('world assignees', this.assignees);

        //this.setSelectedIndex(0); // can't set this early; requires DOM

        const container = this.createContainer();
        this.graphPaper = new GraphPaper('utopia-land-assign-canvas');
        this.container = container;

        // center at bottom of screen
        // container.style.position = 'absolute';
        // container.style.left = '0';
        // container.style.top = '0';
        // container.style.transform = 'translate(-50%, -50%)';
        // container.style.float = '';
        // container.style.border = '';  // not tight around edges

        container.style.width = '100%';
        container.style.height = '100%'
        container.style.background = 'rgba(255,255,255,1.0)'
        container.style.padding = '0.5em';

        const outerDiv = document.createElement('div');

        outerDiv.style.position = 'fixed';
        outerDiv.style.zIndex = 10;
        outerDiv.style.left = '0';
        outerDiv.style.bottom = '0';
        outerDiv.style.width = '100%';
        outerDiv.style.height = '70%';
        outerDiv.style.visibility = 'hidden';
        outerDiv.style.transition = 'all 0.5s ease 0s';
        outerDiv.style.opacity = 0;
        outerDiv.appendChild(container);
        this.outerDiv = outerDiv;

        document.body.appendChild(outerDiv);

        this.enabled = this.opts.enable;
        this.onSaveBtnClick = this.onSaveBtnClick.bind(this);
        this.onCancelBtnClick = this.onCancelBtnClick.bind(this);

        if(this.enabled){
            this.enable()
        }
    }

    enable() {
        this.enabled = true;
        this.outerDiv.style.visibility = '';
        this.outerDiv.style.opacity = 1;
        this.graphPaper.init();
        let {wallet} = this.opts;
        let {assignees} = this;
        let drawer = this.graphPaper.getPlugin('drawer');
        for(let w in assignees){
            let borderColor = "#aaa";
            let backgroundColor = "#ccc";
            console.log('wallets', wallet, w);
            if(wallet.toUpperCase() === w.toUpperCase()){
                borderColor = undefined;
                backgroundColor = undefined
            }
            for(let r of assignees[w]){
                drawer.addRect(
                    r.x1, r.y1, r.x2-r.x1, r.y2-r.y1,
                    borderColor, backgroundColor,
                    {wallet: w, time: r.time}
                );
            }
        }
        let grid = this.graphPaper.getPlugin('grid');
        grid.on('mousedown', e => {
            if(e.which === Mouse.MOUSE_RIGHT_BUTTON)
                this.emit('go-to-location', e);
        })


        this.game.plugins.get('game-shell-fps-camera').on('view', (viewMatrix) => {
            // console.log('game-shell-fps-camera:view', viewMatrix);
            let pos = this.game.cameraPosition();
            this.graphPaper.getPlugin('z_coordinate').setPos(pos[0], pos[2]);
        })
        this.container.querySelector('#utopia-land-assign-btn-save').addEventListener('click', this.onSaveBtnClick)
        this.container.querySelector('#utopia-land-assign-btn-cancel').addEventListener('click', this.onCancelBtnClick)
        // this.container.querySelector('canvas')
        //     .addEventListener('contextmenu', e => {
        //         e.preventDefault();
        //         alert(123)
        //     })
        super.enable();
    }

    getUserAssignedRectangles(){
        return this.assignees[this.opts.wallet.toUpperCase()];
    }

    getAllAssignedLands(){
        return this.assignees;
    }

    onSaveBtnClick(){
        let rectangles = this.graphPaper.getPlugin('drawer').getRectangles(this.opts.wallet);
        console.log('rectangles', rectangles);
        this.emit('save', rectangles);
    }

    onCancelBtnClick(){
        this.disable()
    }

    disable() {
        this.enabled = false;
        this.outerDiv.style.visibility = 'hidden';
        this.outerDiv.style.opacity = 0;

        this.container.querySelector('#utopia-land-assign-btn-save').removeEventListener('click', this.onSaveBtnClick)
        this.container.querySelector('#utopia-land-assign-btn-cancel').removeEventListener('click', this.onCancelBtnClick)
        super.disable();
    }

    toggle(){
        this.enabled ? this.disable() : this.enable()
    }

    refresh() {
        // this.refresh();
    }

    createContainer(){
        let container = document.createElement('div');
        container.innerHTML = CONTAINER_TEMPLATE;
        return container;
    }
}

const CONTAINER_TEMPLATE = `
<div style="position: relative; display: flex; flex-direction: column; width: 100%; height: 100%">
    <div style="flex-grow: 0; padding-bottom: 0.5em">
        <button id="utopia-land-assign-btn-save">Save</button>
        <button id="utopia-land-assign-btn-cancel">Cancel</button>
    </div>
    <div style="position: relative; flex-grow: 1">
        <canvas id="utopia-land-assign-canvas" style="width: 100%; height: 100%">
            Your Browser does not support the canvas element.
        </canvas>
    </div>
</div>`;
