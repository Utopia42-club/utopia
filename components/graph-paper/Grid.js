const {EventEmitter} = require('events');
// basic line class
class Line {
    constructor(color, lineWidth, startX, startY, endX, endY) {
        this.color = color
        this.lineWidth = lineWidth
        this.startX = startX
        this.startY = startY
        this.endX = endX
        this.endY = endY
    }

    draw(ctx) {
        const {color, lineWidth, startX, startY, endX, endY} = this
        ctx.save()

        ctx.beginPath()
        ctx.strokeStyle = color
        ctx.lineWidth = lineWidth
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()

        ctx.restore()
    }
}

class Grid extends EventEmitter{
    constructor(graphPaper, opts) {
        super()
        this.canvas = graphPaper.canvas;
        this.color = opts.color || 'gray';
        this.lineWidth = opts.lineWidth || 0.3;
        this.step = opts.step || 10;
        this.boldNth = opts.boldNth || 5;
        this.boldColor = opts.boldColor || 'DarkGray';
        this.boldWidth = opts.boldWidth || 0.5;
        this.fontSize = opts.fontSize || 12
        this.xGridStart = opts.x1 || -25;
        this.yGridStart = opts.y1 || -25;

        this.lines = null
        this.dragging = false;
        this.onSizeChange = this.onSizeChange.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
    }

    init(){
        this.enable();
    }

    // TODO: add a callback hook
    enable (enabled = true) {
        const { canvas } = this

        if (enabled) {
            window.addEventListener('resize', this.onSizeChange);
            canvas.addEventListener('mousedown', this.onMouseDown);
            canvas.addEventListener('mouseup', this.onMouseUp);
        } else {
            window.removeEventListener('resize', this.onSizeChange)
            window.removeEventListener('mousedown', this.onMouseDown);
            canvas.removeEventListener('mouseup', this.onMouseUp);
        }

        return this
    }

    onMouseDown(e){
        if(e.which === 1 && !e.ctrlKey) {
            this.oldXGridStart = this.xGridStart;
            this.oldYGridStart = this.yGridStart;

            this.startDragX = e.offsetX;
            this.startDragY = e.offsetY;

            this.dragging = true;
        }else{
            this.dragging = false;
        }
        window.addEventListener('mousemove', this.onMouseMove);
        this.emit('mousedown', {
            xy: this.getMouseRelativeXY(e),
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            which: e.which
        });
    }

    onMouseMove(e){
        if(this.dragging) {
            this.xGridStart = this.oldXGridStart - (e.offsetX - this.startDragX);
            this.yGridStart = this.oldYGridStart - (e.offsetY - this.startDragY);
            this.createLines();
        }
        this.emit('mousemove', {
            xy: this.getMouseRelativeXY(e),
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey
        });
    }

    onMouseUp(e){
        this.dragging = false;
        window.removeEventListener('mousemove', this.onMouseMove);
        this.emit('mouseup', {
            xy: this.getMouseRelativeXY(e),
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey
        });
    }

    onSizeChange(){
        this.createLines();
        this.emit('resize',{width: this.canvas.width, height: this.canvas.height})
    }

    getMouseRelativeXY(e){
        let {canvas} = this;
        const canvasDimensions = canvas.getBoundingClientRect()

        let xy = this.unproject(
            e.clientX - canvasDimensions.left,
            e.clientY - canvasDimensions.top
        );
        return {
            x: Math.floor(xy.x),
            y: Math.floor(xy.y)
        }
    }

    createLines() {
        let {canvas} = this;
        const {
            color, lineWidth, step,
            boldNth, boldColor, boldWidth
        } = this

        const lines = []
        const div = boldNth * step

        let rect = canvas.getBoundingClientRect();
        let width = Math.round(rect.width),
            height = Math.round(rect.height);

        // let startX = Math.round(width / 2),
        //     startY = Math.round(height / 2)
        let {xGridStart, yGridStart} = this;
        let startX = (step - xGridStart % step) % step,
            startY = (step - yGridStart % step) % step;

        canvas.width = width;
        canvas.height = height;

        // vertical lines
        for (let x = startX; x < canvas.width; x += step) {
            const isNth = (x + xGridStart) % div === 0
            let isZero = (x + xGridStart) === 0;

            lines.push(
                isNth
                    ? new Line(boldColor, isZero?1:boldWidth, x, 0, x, canvas.height)
                    : new Line(color, isZero?1:lineWidth, x, 0, x, canvas.height)
            )
        }

        // horizontal lines
        for (let y = startY; y < canvas.height; y += step) {
            const isNth = (y + yGridStart) % div === 0
            let isZero = (y + yGridStart) === 0;

            lines.push(
                isNth
                    ? new Line(boldColor, isZero?1:boldWidth, 0, y, canvas.width, y)
                    : new Line(color, isZero?1:lineWidth, 0, y, canvas.width, y)
            )
        }

        this.lines = lines
    }

    unproject(x, y){
        let {xGridStart, yGridStart} = this;
        return {x: x + xGridStart, y: y + yGridStart}
    }

    drawText() {
        let {canvas} = this;
        let ctx = canvas.getContext('2d');
        const {step, boldNth, boldColor, fontSize} = this

        let {xGridStart, yGridStart} = this;

        let boldStep = step * boldNth;

        let startX = boldStep - xGridStart % boldStep,
            startY = boldStep - yGridStart % boldStep;

        ctx.save()
        ctx.font = `${this.fontSize}px Monospace`
        ctx.fillStyle = boldColor

        // add 0,0
        // ctx.fillText('0', 1, 15)

        // create vertical text
        for (let x = startX; x < canvas.width; x += boldStep) {
            ctx.fillText(xGridStart + x, x, this.fontSize)
        }

        // create horizontal text
        for (let y = startY; y < canvas.height; y += boldStep) {
            ctx.fillText(yGridStart + y, 0, y + this.fontSize)
        }

        ctx.restore()
    }

    draw() {
        let {canvas} = this;
        let ctx = canvas.getContext('2d');
        if (!this.lines) this.createLines()

        this.lines.forEach(line => line.draw(ctx))
        this.drawText()
    }
}

module.exports = Grid;
