var webworkify = require('webworkify');
var unworkify = require('unworkify');
var ndarray = require('ndarray');

module.exports = function(game, opts) {
    return new Materials(game, opts);
};

module.exports.pluginInfo = {
    loadAfter: ['voxel-registry'],
    //clientOnly: true // TODO?
};

function Materials(game, opts) {
    this.game = game;

    if (!game.plugins || !game.plugins.get('voxel-registry')) throw new Error('voxel-land requires voxel-registry');
    this.registry = game.plugins.get('voxel-registry');

    opts = opts || {};
    opts.materials = opts.materials || undefined;
    opts.registerBlocks = opts.registerBlocks === undefined ? true : opts.registerBlocks;
    opts.registerItems = opts.registerItems === undefined ? true : opts.registerItems;

    this.opts = JSON.parse(JSON.stringify(opts));

    this.enable();
}

Materials.prototype.enable = function() {
    this.registerBlocks();
};

Materials.prototype.disable = function() {
    // TODO: unregister blocks?
};

Materials.prototype.registerBlocks = function()  {
    if (this.opts.materials) return; // only register blocks once TODO: remove after adding unregister

    if (this.opts.registerItems) {
        this.registry.registerItem('coal', {itemTexture: 'i/coal', fuelBurnTime: 1})
    }

    if (this.opts.registerBlocks) {
        this.registry.registerBlock('grass', {texture: ['grass_top', 'dirt', 'grass_side'], hardness:1.0, itemDrop: 'dirt', effectiveTool: 'spade'});
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
};