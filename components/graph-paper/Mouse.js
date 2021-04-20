const MOUSE_LEFT_BUTTON = 1;
const MOUSE_MIDDLE_BUTTON = 2;
const MOUSE_RIGHT_BUTTON = 3;

module.exports = class Mouse {
  constructor (graphPaper, opts) {
    this.graphPaper = graphPaper;
    this.x = opts.x || 0;
    this.y = opts.y || 0;
    this.gridX = ''
    this.gridY = ''
    this.canvas = graphPaper.canvas;
    this.color = opts.color || 'gray';
    this.font = opts.font || '16px Monospace'

    this.setPos = this.setPos.bind(this)
  }

  init(){
    this.grid = this.graphPaper.getPlugin('grid');
    this.track();
  }

  // TODO: add a callback hook
  track (enabled = true) {
    const { canvas } = this

    if (enabled) {
      canvas.addEventListener('mousemove', this.setPos)
    } else {
      canvas.removeEventListener('mousemove', this.setPos)
    }

    return this
  }

  // sets x, y from mousemove event
  setPos (evt) {
    const { canvas } = this
    const canvasDimensions = canvas.getBoundingClientRect()

    // get mouse position relative to canvas
    this.x = Math.floor(evt.clientX - canvasDimensions.left)
    this.y = Math.floor(evt.clientY - canvasDimensions.top)

    let xy = this.grid.unproject(
        evt.clientX - canvasDimensions.left,
        evt.clientY - canvasDimensions.top
    );
    this.gridX = Math.floor(xy.x);
    this.gridY = Math.floor(xy.y);

    return this
  }

  draw () {
    const { x, y, gridX, gridY, canvas, font, color } = this
    let ctx = canvas.getContext('2d');
    const txt = `(${gridX},${gridY})`

    ctx.save()
    ctx.fillStyle = color
    ctx.font = font

    // offset the text position for readability (so it doesnt go off screen)
    const offsetX = x < canvas.width / 2 ? 20 : -ctx.measureText(txt).width - 20
    const offsetY = y < canvas.height / 2 ? 25 : -18

    ctx.fillText(txt, this.x + offsetX, this.y + offsetY)
    ctx.restore()

    return this
  }
}

module.exports.MOUSE_LEFT_BUTTON = MOUSE_LEFT_BUTTON;
module.exports.MOUSE_MIDDLE_BUTTON = MOUSE_MIDDLE_BUTTON;
module.exports.MOUSE_RIGHT_BUTTON = MOUSE_RIGHT_BUTTON;
