var ndarray = require('ndarray');

module.exports = function(game, opts) {
    return new UtopiaLand(game, opts);
};
module.exports.pluginInfo = {
    loadAfter: ['voxel-registry', 'voxel-recipes', 'voxel-food', 'voxel-mesher', 'voxel-world-changes']
};

function UtopiaLand(game, opts) {
    this.game = game;

    this.registry = game.plugins.get('voxel-registry');
    if (!this.registry) throw new Error('utopia-land requires voxel-registry plugin');

    this.worldChanges = game.plugins.get('voxel-world-changes');
    if (!this.worldChanges) throw new Error('utopia-land requires voxel-world-changes plugin');

    opts = opts || {};

    opts.registerBlocks = opts.registerBlocks === undefined ? true : opts.registerBlocks;
    opts.registerItems = opts.registerItems === undefined ? true : opts.registerItems;
    opts.registerRecipes = opts.registerRecipes === undefined ? true : opts.registerRecipes;

    this.opts = JSON.parse(JSON.stringify(opts));
    this.enable();
}

UtopiaLand.prototype.enable = function() {
    this.registerBlocks();
    this.game.voxels.on('missingChunk', this.onMissingChunk = this.missingChunk.bind(this));
};

UtopiaLand.prototype.disable = function() {
    this.game.voxels.removeListener('missingChunk', this.onMissingChunk);
};

UtopiaLand.prototype.registerBlocks = function()  {
    if (this.opts.materials) return; // only register blocks once TODO: remove after adding unregister

    if (this.opts.registerItems) {
        this.registry.registerItem('coal', {itemTexture: 'i/coal', fuelBurnTime: 1})
    }

    if (this.opts.registerBlocks) {
        this.registry.registerBlock('grass', {texture: ['grass_top', 'dirt', 'grass_side'], hardness:0.3, itemDrop: 'dirt', effectiveTool: 'spade'});
        this.registry.registerBlock('dirt', {texture: 'dirt', hardness:0.75, effectiveTool: 'spade'});
        this.registry.registerBlock('stone', {displayName: 'Smooth Stone', texture: 'stone', hardness:10.0, itemDrop: 'cobblestone', effectiveTool: 'pickaxe', requiredTool: 'pickaxe'});
        this.registry.registerBlock('logOak', {displayName: 'Oak Wood', texture: ['log_oak_top', 'log_oak_top', 'log_oak'], hardness:2.0, effectiveTool: 'axe', creativeTab: 'plants'});
        this.registry.registerBlock('cobblestone', {texture: 'cobblestone', hardness:10.0, effectiveTool: 'pickaxe', requiredTool: 'pickaxe'});
        this.registry.registerBlock('oreCoal', {displayName: 'Coal Ore', texture: 'coal_ore', itemDrop: 'coal', hardness:15.0, requiredTool: 'pickaxe'});
        this.registry.registerBlock('oreIron', {displayName: 'Iron Ore', texture: 'iron_ore', hardness:15.0, requiredTool: 'pickaxe'});
        this.registry.registerBlock('brick', {texture: 'brick'}); // some of the these blocks don't really belong here..do they?
        this.registry.registerBlock('obsidian', {texture: 'obsidian', hardness: 128, requiredTool: 'pickaxe'});
        this.registry.registerBlock('leavesOak', {displayName: 'Oak Leaves', texture: 'leaves_oak', transparent: true, hardness: 0.1, creativeTab: 'plants',
            // if voxel-food apple is enabled, drop it when breaking laves (oak apples)
            itemDrop: this.registry.getItemProps('apple') ? 'apple' : null});

        this.registry.registerBlock('logBirch', {texture: ['log_birch_top', 'log_birch_top', 'log_birch'], hardness:2.0,
            displayName: 'Birch Wood', effectiveTool: 'axe', creativeTab: 'plants'}); // TODO: generate
    }

    if (this.opts.registerRecipes) {
        var recipes = this.game.plugins.get('voxel-recipes');
        if (recipes) { // TODO: should these be properties on voxel-registry, instead?
            recipes.thesaurus.registerName('wood.log', 'logOak');
            recipes.thesaurus.registerName('wood.log', 'logBirch');
            recipes.thesaurus.registerName('tree.leaves', 'leavesOak');
        }
    }

    if (!this.opts.materials) {
        this.opts.materials = {};
        for (var blockIndex = 1; blockIndex < this.registry.blockProps.length; blockIndex += 1) {
            var name = this.registry.getBlockName(blockIndex);
            var packedIndex = this.registry.getBlockIndex(name);
            this.opts.materials[name] = packedIndex;
        }
    }
};

UtopiaLand.prototype.changedValue = function(voxel){
    return this.worldChanges.changes[voxel.join('_')];
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
                    for (let y = 0; y < this.game.chunkSize; ++y) {
                        voxels.set(x, y, z, y===this.game.chunkSize-1 ? grassIndex : dirtIndex);
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