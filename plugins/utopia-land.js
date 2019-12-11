var ndarray = require('ndarray');

module.exports = function(game, opts) {
    return new UtopiaLand(game, opts);
};
module.exports.pluginInfo = {
    loadAfter: [
        'voxel-registry',
        'voxel-recipes',
        'voxel-food',
        'voxel-mesher',
        'voxel-materials',
        'voxel-world-changes',
        'utopia-land-assign'
    ]
};

function UtopiaLand(game, opts) {
    this.game = game;

    this.registry = game.plugins.get('voxel-registry');
    if (!this.registry) throw new Error('utopia-land requires voxel-registry plugin');

    this.worldChanges = game.plugins.get('voxel-world-changes');
    if (!this.worldChanges) throw new Error('utopia-land requires voxel-world-changes plugin');

    this.landAssign = game.plugins.get('utopia-land-assign');

    opts = opts || {};
    this.opts = JSON.parse(JSON.stringify(opts));
    this.enable();
}

UtopiaLand.prototype.enable = function() {
    this.game.voxels.on('missingChunk', this.onMissingChunk = this.missingChunk.bind(this));
};

UtopiaLand.prototype.disable = function() {
    this.game.voxels.removeListener('missingChunk', this.onMissingChunk);
};

UtopiaLand.prototype.changedValue = function(voxel){
    return this.worldChanges.changes[voxel.join('_')];
}

UtopiaLand.prototype.checkUserAssignedArea = function(rectangles, x, y){
    if(!rectangles || rectangles.length === 0)
        return false;
    for(let {x1, x2, y1, y2} of rectangles){
        if(x1 <= x && x <= x2 && y1 <= y && y <= y2)
            return true;
    }
    return false;
}

UtopiaLand.prototype.missingChunk = function(position) {
    // console.log('utopia-land missingChunk',position);

    // if (position[1] > 0) return; // everything above y=0 is air

    var bedrockIndex = this.registry.getBlockIndex('bedrock');
    if (!bedrockIndex) {
        throw new Error('utopia-land unable to find block of name: bedrock');
    };

    var grassIndex = this.registry.getBlockIndex('grass');
    if (!grassIndex) {
        throw new Error('utopia-land unable to find block of name: grass');
    };

    var dirtIndex = this.registry.getBlockIndex('dirt');
    if (!dirtIndex) {
        throw new Error('utopia-land unable to find block of name: dirt');
    };

    var stoneIndex = this.registry.getBlockIndex('stone');
    if (!stoneIndex) {
        throw new Error('utopia-land unable to find block of name: stone');
    };

    var width = this.game.chunkSize;
    var pad = this.game.chunkPad;
    var arrayType = this.game.arrayType;

    var buffer = new ArrayBuffer((width+pad) * (width+pad) * (width+pad) * arrayType.BYTES_PER_ELEMENT);
    var voxelsPadded = ndarray(new arrayType(buffer), [width+pad, width+pad, width+pad]);
    var h = pad >> 1;
    var voxels = voxelsPadded.lo(h,h,h).hi(width,width,width);

    let userAssignedRectangles = this.landAssign.getUserAssignedRectangles();

    if(position[1] < 0){
        for (let x = 0; x < this.game.chunkSize; ++x) {
            for (let z = 0; z < this.game.chunkSize; ++z) {
                for (let y = 0; y < this.game.chunkSize; ++y) {
                    voxels.set(x, y, z, bedrockIndex);
                }
            }
        }
    }else{
        if(position[1] === 0){
            for (let x = 0; x < this.game.chunkSize; ++x) {
                for (let z = 0; z < this.game.chunkSize; ++z) {
                    let isInUserAssignedArea = this.checkUserAssignedArea(
                        userAssignedRectangles,
                        x + position[0] * this.game.chunkSize,
                        z + position[2] * this.game.chunkSize
                    );
                    for (let y = 0; y < this.game.chunkSize; ++y) {
                        if(isInUserAssignedArea)
                            voxels.set(x, y, z, y===this.game.chunkSize-1 ? grassIndex : dirtIndex);
                        else
                            voxels.set(x, y, z, bedrockIndex);
                    }
                }
            }
        }else if(position[0] == 0 && position[1] == 1 && position[2] == 0){
            let centerX = 10, centerZ = 10;
            for (let y = 0; y < 5; ++y) {
                for (let x = -5+y; x < 5-y; ++x) {
                    for (let z = -5+y; z < 5-y; ++z) {
                        voxels.set(centerX + x, y, centerZ + z, stoneIndex);
                    }
                }
            }
        }
        let changes = this.worldChanges.changes[position.join('_')];
        if(changes) {
            Object.keys(changes).map(k => changes[k]).map(({voxel, value}) => {
                voxels.set(voxel[0], voxel[1], voxel[2], value);
            });
        }
    }


    var chunk = voxelsPadded;
    chunk.position = position;

    // console.log('about to showChunk',chunk);
    this.game.showChunk(chunk);
};