module.exports = class Mouse {
  constructor (graphPaper, opts) {
    this.graphPaper = graphPaper;
    this.x = opts.x || 0;
    this.y = opts.y || 0;
    this.canvas = graphPaper.canvas;
    this.color = opts.color || 'red';
    this.font = opts.font || '16px Monospace'

    this.setPos = this.setPos.bind(this)
  }

  init(){
    this.grid = this.graphPaper.getPlugin('grid');
    this.track();
  }

  // TODO: add a callback hook
  track (enabled = true) {
    return this
  }

  // sets x, y from mousemove event
  setPos (x, y) {
    this.x = x
    this.y = y

    return this
  }

  draw () {
    const {canvas, font, color } = this
    let ctx = canvas.getContext('2d');

    let xy = [-50, -50];
    if(this.grid && this.grid.project){
      let temp = this.grid.project(this.x, this.y);
      // console.log('====', {x:this.x, y:this.y} ,temp);
      xy = [temp.x, temp.y];
    }

    ctx.save()
    ctx.lineWidth = 5;
    ctx.strokeStyle = color;

    ctx.translate(xy[0], xy[1]);

    ctx.beginPath();

    ctx.moveTo(-5, -5);
    ctx.lineTo(5, 5);

    ctx.moveTo(5, -5);
    ctx.lineTo(-5, 5);

    ctx.stroke();

    ctx.restore()

    return this
  }
}
