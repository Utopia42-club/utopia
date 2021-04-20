// const {Grid, Mouse, Drawer} = require("./");

const Grid = require('./Grid');
const Mouse = require('./Mouse');
const Drawer = require('./Drawer');
const UserCoordinate = require('./UserCoordinate');

module.exports = class GraphPaper {
    constructor(canvasID){
        this.canvasID = canvasID;
        this.canvas = null;
        this.plugins = {
            'mouse': Mouse,
            'grid': Grid,
            'drawer': Drawer,
            'z_coordinate': UserCoordinate
        };

        this.pluginOptions = {
            'mouse': {
                color: 'red',
                font: '12px Monospace'
            },
            'grid': {
                color: 'green',
                boldColor: 'darkGreen',
                step: 10
            }
        }
        this.pluginObjects = {};

        this.update = this.update.bind(this);
        this.init = this.init.bind(this);
    }

    initPlugins(){
        let {plugins, pluginObjects, pluginOptions} = this;
        Object.keys(plugins).map(name => {
            console.log(`loading plugin ${name} ...`);
            console.log('plugin constructor', plugins[name]);
            this.pluginObjects[name] = new plugins[name](this, pluginOptions[name] || {});
        })

        Object.keys(plugins).map(name => {
            pluginObjects[name].init && pluginObjects[name].init();
        })
    }

    getPlugin(pluginName){
        return this.pluginObjects[pluginName];
    }

    init() {
        this.canvas = document.getElementById(this.canvasID)

        this.initPlugins();

        // grid = new Grid(canvas)
        // mouse = new Mouse(canvas, 'red', 'Bold 12px Monospace')

        // mouse.track(grid)
        // grid.watchSize();
        window.requestAnimationFrame(this.update)
    }

    draw(){
        let {plugins} = this;
        Object.keys(plugins).map(name => {
            this.pluginObjects[name].draw();
        })
    }

    update () {
        let {canvas} = this;
        window.requestAnimationFrame(this.update)
        let ctx = canvas.getContext('2d');
        ctx.save()

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        // ctx.translate(Math.round(canvas.width/2), Math.round(canvas.height/2))
        // mouse.draw()
        // grid.draw()
        this.draw();

        ctx.restore();
    }
}