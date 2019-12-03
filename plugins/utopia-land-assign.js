'use strict';

const EventEmitter = require('events').EventEmitter;
const ever = require('ever');

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

        //this.setSelectedIndex(0); // can't set this early; requires DOM

        const container = this.createContainer();
        this.container = container;

        // center at bottom of screen
        container.style.zIndex = 10;
        container.style.position = 'absolute';
        container.style.left = '0';
        container.style.top = '0';
        container.style.transform = 'translate(-50%, -50%)';
        container.style.float = '';
        container.style.border = '';  // not tight around edges
        container.style.visibility = 'hidden';
        container.style.transition = 'all 0.5s ease 0s';
        container.style.opacity = 0;
        container.style.background = 'rgba(255,255,255,0.7)'

        const outerDiv = document.createElement('div');
        outerDiv.style.position = 'absolute';
        outerDiv.style.left = '50%';
        outerDiv.style.top = '50%';
        outerDiv.style.width = '100%';
        outerDiv.style.height = '0';
        // outerDiv.style.textAlign = 'center';
        outerDiv.appendChild(container);

        document.body.appendChild(outerDiv);

        this.enabled = this.opts.enable;

        if(this.enabled){
            this.enable()
        }
    }

    enable() {
        this.enabled = true;
        this.container.style.visibility = '';
        this.container.style.opacity = 1;
        super.enable();
    }

    disable() {
        this.enabled = false
        this.container.style.visibility = 'hidden';
        this.container.style.opacity = 0;
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
        container.innerHTML = `<h1>this is land assign</h1>`;
        return container;
    }
}