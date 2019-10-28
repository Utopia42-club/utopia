'use strict';

const EventEmitter = require('events').EventEmitter;

module.exports = (game, opts) => new WorldChanges(game, opts);

module.exports.pluginInfo = {
    loadAfter: ['voxel-mine', 'voxel-use', "voxel-registry", 'utopia-land']
}

class WorldChanges extends EventEmitter {
    constructor(game, opts) {
        super();

        if(opts === undefined)
            opts = {};

        this.game = game;
        this.changes = {};
        this.mine = game.plugins.get('voxel-mine');
        this.use = game.plugins.get('voxel-use');
        this.registry = game.plugins.get('voxel-registry');
        if(opts.changes)
            this.importChanges(opts.changes);

        // if(this.game.controls.target())
        //     this.game.controls.target().avatar.yaw.position.set(0, 120, 0)

        this.enable();
    }

    enable() {
        this.mine.on('break', this.onBreak = (target) => {
            if (!target) {
                console.log('no block mined');
                return;
            }
            let info = this.getVoxelChunk(target.voxel);
            this.appendChange(info, 0);
            console.log('world changed', 'break', this.changes, target);
        });

        this.use.on('usedBlock', this.onUse = (target, held, newHeld) => {
            if (!target) {
                return;
            }
            let info = this.getVoxelChunk(target.adjacent);
            this.appendChange(info, this.registry.getBlockIndex(held.item));
            console.log('world changed', 'use', this.changes);
        });
    }

    getVoxelChunk(voxel){
        let chunkX = Math.floor(voxel[0] / this.game.chunkSize),
            chunkY = Math.floor(voxel[1] / this.game.chunkSize),
            chunkZ = Math.floor(voxel[2] / this.game.chunkSize);

        let voxelX = voxel[0] - chunkX * this.game.chunkSize,
            voxelY = voxel[1] - chunkY * this.game.chunkSize,
            voxelZ = voxel[2] - chunkZ * this.game.chunkSize;

        return {
            chunk: [chunkX, chunkY, chunkZ],
            voxel: [voxelX, voxelY, voxelZ]
        }
    }

    appendChange(voxelInfo, value){
        let chunkIndex = voxelInfo.chunk.join('_'),
            voxelIndex = voxelInfo.voxel.join('_');
        if(this.changes[chunkIndex] === undefined)
            this.changes[chunkIndex] = {};
        this.changes[chunkIndex][voxelIndex] = {
            voxel: voxelInfo.voxel,
            value: value
        }
    }

    disable() {
        this.mine.removeListener('break', this.onBreak);
        this.use.removeListener('usedBlock', this.onUse);
    }

    importChanges(changes){
        this.changes = {};
        try {
            Object.keys(changes).map(chunkHash => {
                Object.keys(changes[chunkHash]).map(voxelHash => {
                    let value = this.registry.getBlockIndex(changes[chunkHash][voxelHash].name);
                    if (value === undefined)
                        throw new Error(`loading world changes failed. block with name ${changes[chunkHash][voxelHash].name} not registered`)
                    changes[chunkHash][voxelHash].value = value;
                })
            })
        }catch (e) {
        }
        this.changes = changes;
    }

    exportChanges(){
        let result = JSON.parse(JSON.stringify(this.changes));
        Object.keys(result).map(chunkHash => {
            Object.keys(result[chunkHash]).map(voxelHash => {
                let name = this.registry.getBlockName(result[chunkHash][voxelHash].value);
                if(name === undefined)
                    throw new Error(`exporting world changes failed. block with index ${result[chunkHash][voxelHash].value} not registered`)
                delete result[chunkHash][voxelHash].value;
                result[chunkHash][voxelHash].name = name;
            })
        });
        return result;
    }
}