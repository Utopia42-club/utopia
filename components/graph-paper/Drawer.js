module.exports = class Drawer {
    constructor (graphPaper, opts) {
        this.graphPaper = graphPaper;
        this.canvas = graphPaper.canvas

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);

        this.rects = [];
    }

    clearRects(){
        this.rects = [];
    }

    addRect(x, y, w, h, borderColor='blue', backgroundColor='rgba(0,0,255,0.2)', data=undefined){
        this.rects.push({
            data,
            borderColor,
            backgroundColor,
            coords: {x, y, w, h}
        })
    }

    getRectangles(wallet){
        return this.rects
            .filter(r => (!r.data || r.data.wallet.toUpperCase() == wallet.toUpperCase()))
            .map(r => ({...r.coords, time: r.data ? r.data.time : undefined}));
    }

    init(){
        this.grid = this.graphPaper.getPlugin('grid');
        this.grid.on('mousedown', this.onMouseDown)
        this.grid.on('mousemove', this.onMouseMove)
        this.grid.on('mouseup', this.onMouseUp)
    }

    onMouseDown(e){
        if(e.ctrlKey){
            this.drawing = true;
            this.startDrawXY = e.xy;
            this.endDrawXY = e.xy;
        }else{
            this.drawing = false;
        }
        // console.log('mousedown', xy);
    }

    onMouseMove(e){
        this.endDrawXY = e.xy;
        // console.log('mousemove', xy);
    }

    onMouseUp(e){
        const { rects, startDrawXY, endDrawXY, drawing } = this;
        const {step} = this.grid;
        if(drawing) {
            let x1 = Math.min(startDrawXY.x, endDrawXY.x),
                y1 = Math.min(startDrawXY.y, endDrawXY.y),
                x2 = Math.max(startDrawXY.x, endDrawXY.x),
                y2 = Math.max(startDrawXY.y, endDrawXY.y);

            if (x2-x1 > 10 && y2-y1 > 10) {
                x1 = Math.floor(x1 / step) * step;
                y1 = Math.floor(y1 / step) * step;

                let w = Math.abs(x2 - x1);
                let h = Math.abs(y2 - y1);

                if(w % step > 0)
                    w = Math.ceil(w / step) * step;
                if(h % step > 0)
                    h = Math.ceil(h / step) * step;
                if(!this.collisionDetect()) {
                    rects.push({coords: {x:x1, y:y1, w, h}})
                }else
                    console.error('collision detected')
            }else{
                console.error('width or height of rectangle is smaller than 10')
            }
        }
        this.drawing = false;
        this.startDrawXY = null;
        this.endDrawXY = null;
        // console.log('mouseup', xy);
    }

    collisionDetect(){
        const { rects, startDrawXY, endDrawXY, drawing } = this;
        if(!drawing)
            return false;
        let x = Math.min(startDrawXY.x, endDrawXY.x),
            y = Math.min(startDrawXY.y, endDrawXY.y),
            w = Math.abs(startDrawXY.x - endDrawXY.x),
            h = Math.abs(startDrawXY.y - endDrawXY.y);

        for(let {coords} of rects){
            if(x < coords.x + coords.w &&
                x + w > coords.x &&
                y < coords.y + coords.h &&
                y + h > coords.y)
                return true
        }
    }

    draw () {
        const { canvas, rects, startDrawXY, endDrawXY, drawing } = this;
        let ctx = canvas.getContext('2d');
        ctx.save()
        // ctx.fillStyle = color
        // ctx.font = font

        ctx.fillStyle = 'rgba(0,0,255,0.2)';
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;

        // // offset the text position for readability (so it doesnt go off screen)
        // const offsetX = x < canvas.width / 2 ? 20 : -ctx.measureText(txt).width - 20
        // const offsetY = y < canvas.height / 2 ? 25 : -18
        //
        // ctx.fillText(txt, this.x + offsetX, this.y + offsetY)
        ctx.translate(-this.grid.xGridStart, -this.grid.yGridStart)
        rects.map(l => {
            ctx.save()

            ctx.fillStyle = l.backgroundColor || 'rgba(0,0,255,0.2)';
            ctx.strokeStyle = l.borderColor || 'blue';

            let {x, y, w, h} = l.coords;
            ctx.beginPath()
            ctx.rect(x,y, w, h);
            ctx.fill();
            ctx.stroke();

            ctx.restore();
        })

        if(drawing){
            if(this.collisionDetect()){
                ctx.fillStyle = 'rgba(255,0,0,0.2)';
                ctx.strokeStyle = 'red';
            }
            ctx.beginPath()
            ctx.rect(startDrawXY.x,startDrawXY.y, endDrawXY.x-startDrawXY.x, endDrawXY.y-startDrawXY.y);
            ctx.fill();
            ctx.stroke();
        }

        ctx.restore()
        return this
    }
}
