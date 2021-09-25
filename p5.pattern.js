// p5.Pattern
// MIT License
// Copyright (c) 2021 Taichi Sayama
// A pattern drawing library for p5.js.


// ---------------------------------------------------------------------------
// PatternControler Calss
// ---------------------------------------------------------------------------

function PatternControler()
{
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;
    this.colors = ['#FFFFFF', '#000000'];
    this.angle = 0;
    this.patternFunction = null;
    this.renderTarget = null;
}

// ---------------------------------------------------------------------------

/*
Function to change the amount of pattern rotation.
Use patternAngle() to check current angle.
*/
PatternControler.prototype.patternAngle = function(_angle)
{
    if(typeof(_angle) === 'number') this.angle = _angle;
    return this.angle;
}


/*
Function to set the drawing function.
*/
PatternControler.prototype.setPatternFunction = function(_func)
{
    if(typeof(_func) !== 'function')return false;
    this.patternFunction = _func;
    return this.patternFunction;
};
 

/**
 * Function to set parameters and draw pattern.
 * @param {Number} _x   x-coordinate of the corner of pattern 
 * @param {Number} _y   y-coordinate of the corner of pattern 
 * @param {Number} _w   width of the pattern
 * @param {Number} _h   height of the pattern
 * @param {} _renderTarget 
 */
PatternControler.prototype.applyPattern = function(_x, _y, _w, _h, _renderTarget)
{
    this._setPatternArea(_x, _y, _w, _h);
    this._setRenderTarget(_renderTarget);
    this.renderTarget = _renderTarget;
    this._drawPattern();
}

/**
 * Function to set the color palette of the pattern.
 * Use patternColors() to check current palette.
 * @param {Array} _colsArr 
 */
PatternControler.prototype.patternColors = function(_colsArr)
{
if(Array.isArray(_colsArr))this.colors = _colsArr;
//return this.colors;
return this.colors.slice(0, this.colors.length);
}



// ---------------------------------------------------------------------------
//Private functions

/*
Function to change the drawing range of a pattern
*/
PatternControler.prototype._setPatternArea = function(_x, _y, _w, _h)
{
    this.x = _x;
    this.y = _y;
    this.w = _w;
    this.h = _h;
};

/*
Function to set the pattern target.
*/
PatternControler.prototype._setRenderTarget = function(_renderTarget)
{
    this.renderTarget = _renderTarget;
};

/*
Function to draw the pattern.
*/
PatternControler.prototype._drawPattern = function()
{
    const rt = this.renderTarget;

    //Generate a drawing function. apply rotation
    const func = typeof(this.patternFunction) === 'function' ?
    this.patternFunction : this._flatFill();

    const rotatedFunc = this._rotatedFuncGen(func, this.angle);
    
    //cache renderMode
    const pRectMode = rt._renderer._rectMode;
    const pEllipseMode = rt._renderer._ellipseMode;

    //draw
    rt.push();
    rt.drawingContext.clip();
    rt.translate(this.x, this.y);
    rotatedFunc(this.w, this.h, rt);
    rt.pop();

    //reset renderMode
    rt.rectMode(pRectMode);
    rt.ellipseMode(pEllipseMode);
};

/*
Generate a drawing function with rotation applied.
*/
PatternControler.prototype._rotatedFuncGen = function(_ptnFunc, _angle)
{
    const func = function(_w, _h, _rt)
    {
        //Calculate the new size according to the rotation angle.
        const p1 = _rt.createVector(-_w/2, _h/2).rotate(_angle);
        const p2 = _rt.createVector(_w/2, _h/2).rotate(_angle);
        const nw = Math.max(Math.abs(p1.x), Math.abs(p2.x)) * 2;
        const nh = Math.max(Math.abs(p1.y), Math.abs(p2.y)) * 2;

        _rt.push();
        _rt.translate(_w / 2, _h / 2);
        _rt.rotate(_angle);
        _rt.translate(-nw / 2, -nh / 2);
        _ptnFunc(nw, nh, _rt);
        _rt.pop();
    }

    return func;
};

/*
Default pattern function. 
*/
PatternControler.prototype._flatFill = function()
{
    const c = this.patternColors();

    return function(_w, _h, _rt)
    {
        _rt.rectMode(_rt.CORNER);
        _rt.fill(c[0]);
        _rt.noStroke();
        _rt.rect(0, 0, _w, _h);
    }
};



// ---------------------------------------------------------------------------
// Vertex Infomation Class
// ---------------------------------------------------------------------------

function PatternVertexInfo()
{
    this.verticies = [];
    this.isCurve = false;
    this.curveAreaMult = 1.25;
}

// ---------------------------------------------------------------------------

PatternVertexInfo.prototype.reset = function()
{
    this.verticies = [];
    this.isCurve = false;
};

PatternVertexInfo.prototype.addVertex = function(x, y)
{
    this.verticies.push([x, y]);
};

PatternVertexInfo.prototype.addCurveVertex = function(x, y)
{
    this.addVertex(x, y);
    this.isCurve = true;
};

PatternVertexInfo.prototype.addBezierVertex = function(x2, y2, x3, y3, x4, y4)
{
    this.addVertex(x2, y2);
    this.addVertex(x3, y3);
    this.addVertex(x4, y4);
};

PatternVertexInfo.prototype.addQuadraticVertex = function(cx, cy, x3, y3)
{
    this.addVertex(cx, cy);
    this.addVertex(x3, y3);
};

PatternVertexInfo.prototype.culclateArea = function()
{
    let minx = this.verticies[0][0];
    let maxx = minx;
    let miny = this.verticies[0][1];
    let maxy = miny;

    for(let i = 0; i < this.verticies.length; i++)
    {
       let nx =  this.verticies[i][0];
       let ny =  this.verticies[i][1];

       minx = Math.min(minx, nx);
       maxx = Math.max(maxx, nx);
       miny = Math.min(miny, ny);
       maxy = Math.max(maxy, ny);
    }

    let w = maxx - minx;
    let h = maxy - miny;
    let cx = w / 2 + minx;
    let cy = h / 2 + miny;
    
    if(this.isCurve)
    {
        w *= this.curveAreaMult;
        h *= this.curveAreaMult;
    }

    let x = cx - w /2;
    let y = cy - h /2;

    const area = {x : x, y : y, w : w, h : h};

    return area;
};



// ---------------------------------------------------------------------------
// p5 extentions
// ---------------------------------------------------------------------------


p5.prototype._patternControler = new PatternControler(); 
p5.Graphics.prototype._patternControler = new PatternControler();

p5.prototype._patternVertexInfo = new PatternVertexInfo();
p5.Graphics.prototype._patternVertexInfo = new PatternVertexInfo();


/**
 * Function to change the amount of pattern rotation.
 * Use patternAngle() to check current angle.
 * @param {Number} _angle  the angle of rotation, 
 * specified in radians or degrees, depending on current angleMode
 */
p5.prototype.patternAngle = function(_angle)
{
    return this._patternControler.patternAngle(_angle);
};


/**
 * Function to set the color palette of the pattern.
 * Use patternColors() to check current palette.
 * @param {Array} _colsArr 
 */
p5.prototype.patternColors = function(_colsArr)
{
    return this._patternControler.patternColors(_colsArr);
};


/**
 * Function to set the pattern
 * @param  {function} _func     Pattern drawing function.
 */
p5.prototype.pattern = function(_func)
{
    return this._patternControler.setPatternFunction(_func);
};


// ---------------------------------------------------------------------------
//Shape functions

(function()
{
    /*
    Functions to adjust coordinate data
    */
    const _modeAdjust = function(a, b, c, d, mode)
    {
        if (mode === p5.prototype.CORNER) {
        return { x: a, y: b, w: c, h: d };
        } else if (mode === p5.prototype.CORNERS) {
        return { x: a, y: b, w: c - a, h: d - b };
        } else if (mode === p5.prototype.RADIUS) {
        return { x: a - c, y: b - d, w: 2 * c, h: 2 * d };
        } else if (mode === p5.prototype.CENTER) {
        return { x: a - c * 0.5, y: b - d * 0.5, w: c, h: d };
        }
    };

    /*
    Function to disable drawing of fills and stroke.
    */
    const _disableColor = function(_renderTarget)
    {
        _renderTarget.noStroke();
        _renderTarget.fill(255, 0);
    };


    // ---------------------------------------------------------------------------

    //rect
    p5.prototype.rectPattern = function(...args)
    {
        _disableColor(this);
        const r = this.rect(...args);

        const val = _modeAdjust(
            arguments[0],
            arguments[1],
            arguments[2],
            arguments[3],
            this._renderer._rectMode
        );

        this._patternControler.applyPattern(val.x, val.y, val.w, val.h, this);

        return r;
    };

    //square
    p5.prototype.squarePattern = function(...args)
    {
        _disableColor(this);
        const r = this.square(...args);

        const val = _modeAdjust(
            arguments[0],
            arguments[1],
            arguments[2],
            arguments[2],
            this._renderer._rectMode
        );

        this._patternControler.applyPattern(val.x, val.y, val.w, val.h, this);
        return r;
    };

    //ellipse
    p5.prototype.ellipsePattern = function(...args)
    {
        _disableColor(this);
        const r = this.ellipse(...args);
        
        const val = _modeAdjust(
            arguments[0],
            arguments[1],
            arguments[2],
            arguments[3],
            this._renderer._ellipseMode
        );

        this._patternControler.applyPattern(val.x, val.y, val.w, val.h, this);
        return r;
    };

    
    //arc
    p5.prototype.arcPattern = function(...args)
    {
        _disableColor(this);
        const r = this.arc(...args);

        const val = _modeAdjust(
            arguments[0],
            arguments[1],
            arguments[2],
            arguments[3],
            this._renderer._ellipseMode
        );

        this._patternControler.applyPattern(val.x, val.y, val.w, val.h, this);
        return r;
    };

    
    //circle
    p5.prototype.circlePattern = function(...args)
    {
        _disableColor(this);
        const r = this.circle(...args);

        const val = _modeAdjust(
            arguments[0],
            arguments[1],
            arguments[2],
            arguments[2],
            this._renderer._ellipseMode
        );
        this._patternControler.applyPattern(val.x, val.y, val.w, val.h, this);
        return r;
    };

    
    //triangle
    p5.prototype.trianglePattern = function(...args)
    {
        _disableColor(this);
        const r = this.triangle(...args);

        //Calculates the drawing area of the pattern with the center of gravity.
        const cx = (arguments[0] + arguments[2] + arguments[4]) / 3;
        const cy = (arguments[1] + arguments[3] + arguments[5]) / 3;
        const w = this.max([Math.abs(cx - arguments[0]), Math.abs(cx - arguments[2]), Math.abs(cx - arguments[4])]) * 2;
        const h = this.max([Math.abs(cy - arguments[1]), Math.abs(cy - arguments[3]), Math.abs(cy - arguments[5])]) * 2;
        this._patternControler.applyPattern(cx - w /2, cy - h / 2, w, h, this);
        
        //Calculates center position.(Not used)
        /*
        const minX = min(min(arguments[0], arguments[2]), arguments[4]);
        const maxX = max(max(arguments[0], arguments[2]), arguments[4]);
        const minY = min(min(arguments[1], arguments[3]), arguments[5]);
        const maxY = max(max(arguments[1], arguments[3]), arguments[5]);
        */
        return r;
    };

    
    //quad
    p5.prototype.quadPattern = function(...args)
    {
        _disableColor(this);
        const r = this.quad(...args);

        const minX = this.min([arguments[0], arguments[2], arguments[4], arguments[6]]);
        const maxX = this.max([arguments[0], arguments[2], arguments[4], arguments[6]]);
        const minY = this.min([arguments[1], arguments[3], arguments[5], arguments[7]]);
        const maxY = this.max([arguments[1], arguments[3], arguments[5], arguments[7]]);

        this._patternControler.applyPattern(minX, minY, maxX - minX, maxY - minY, this);
        return r;
    };


    //vertex
    p5.prototype.beginShapePattern = function(...args)
    {
        const r = this.beginShape(...args);
        this._patternVertexInfo.reset();
        return r;
    };

    p5.prototype.beginContourPattern = function(...args)
    {
        return this.beginContour(...args);
    };

    p5.prototype.vertexPattern = function(...args)
    {
        const r = this.vertex(...args);
        this._patternVertexInfo.addVertex(arguments[0], arguments[1]);
        return r;
    };

    p5.prototype.curveVertexPattern = function(...args)
    {
        const r = this.curveVertex(...args);
        this._patternVertexInfo.addCurveVertex(arguments[0], arguments[1]);
        return r;
    };

    p5.prototype.bezierVertexPattern = function(...args)
    {
        const r = this.bezierVertex(...args);
        this._patternVertexInfo.addBezierVertex(
            arguments[0], arguments[1], 
            arguments[2], arguments[3],
            arguments[4], arguments[5]
        );
        return r;
    };

    p5.prototype.quadraticVertexPattern = function(...args)
    {
        const r = this.quadraticVertex(...args);
        this._patternVertexInfo.addQuadraticVertex(
            arguments[0], arguments[1], 
            arguments[2], arguments[3]
        );
        return r;
    };

    p5.prototype.endContourPattern = function(...args)
    {
        return this.endContour(...args);
    };

    p5.prototype.endShapePattern = function(...args)
    {
        _disableColor(this);
        const r = this.endShape(...args);
        const area = this._patternVertexInfo.culclateArea();
        this._patternControler.applyPattern(area.x, area.y, area.w, area.h, this);
        return r;
    };

})();



// ---------------------------------------------------------------------------
// Pattern functions.
// ---------------------------------------------------------------------------

const PTN = 
{
    /**
     * Noise pattern
     * patternColors()[0]   base color
     * patternColors()[1]   dot color
     * @param {Number} _density  Density of dots. default = 0.2
     * Constrained between 0 and 1.
     */
     noise : function(_density = 0.2)
     {
         const func = function(_w, _h, _rt = window)
         {
            const density = _rt.constrain(_density, 0, 1);
            const c = _rt.patternColors();

            const num = _w * _h * density;
            const ns = 0.01;
    
            _rt.ellipseMode(_rt.CENTER);
            _rt.rectMode(_rt.CORNER);
            _rt.noStroke();

            _rt.fill(c[0]);
            _rt.rect(0, 0, _w, _h);
    
            _rt.fill(c[1 % c.length]);
            for(let i = 0; i < num; i++){
                const x = _rt.random(_w);
                const y = _rt.random(_h);
                const dia = _rt.noise(x * ns, y * ns) * 0.5 + 1;
                _rt.ellipse(x, y, dia, dia);
            }
         }
         return func;
     },
 
     /**
      * Noise gradient pattern
      * patternColors()[0]   base color
      * patternColors()[1]   dot color
      * @param {Number} _density  Density of dots. default = 0.2
      */
     noiseGrad : function(_density = 0.2)
     {    
         const func = function(_w, _h, _rt = window)
         {
            const density = _rt.min(1, _density);
            const c = _rt.patternColors();

            const num = _w * _h * density;
            const ns = 0.01;

            _rt.rectMode(_rt.CORNER);
            _rt.ellipseMode(_rt.CENTER);
            _rt.noStroke();
    
            _rt.fill(c[0]);
            _rt.rect(0, 0, _w, _h);
    
            _rt.fill(c[1 % c.length]);
            for(let i = 0; i < num; i++){
                const x = _rt.abs(_rt.randomGaussian()) / 5 * _w;
                const y = _rt.random(_h);
                const dia = _rt.noise(x * ns, y * ns) * 0.5 + 1;
                _rt.ellipse(x, y, dia, dia);
            }
         }
         return func;
     },

    /**
     * Stripe pattern
     * Fill the colors of patternColors() in order.
     * @param {Number} _space   Stripe space. default = 10
     */
    stripe : function(_space = 10)
    {
        const func = function(_w, _h, _rt = window)
        {
            _space = Math.abs(_space);
            if(_space == 0)_space = 10;

            const c = _rt.patternColors();

            _rt.rectMode(_rt.CORNER);
            _rt.noStroke();

            let count = 0;

            for(let x = 0; x <= _w + _space; x+= _space)
            {
                _rt.fill(c[count % c.length]);
                _rt.rect(x, 0, Math.ceil(_space), _h);
                count++;
            }
        }
        return func;
    },

    /**
     * Concentric circle stripe pattern.
     * Fill the colors of patternColors() in order.
     * @param {Number} _space      Stripe space. default = 10
     * @param {Number} _minRadius  Minimum radius. default = 0
     */
    stripeCirce : function(_space = 25, _minRadius = 0)
    {
        const func = function(_w, _h, _rt = window)
        {
            _space = _rt.abs(_space);
            if(_space == 0)_space = 25;

            const c = _rt.patternColors();

            const maxRadius = _rt.sqrt(_w * _w + _h * _h);
            const num  = _rt.ceil((maxRadius - _minRadius) / _space);
            
            _rt.ellipseMode(_rt.CENTER);
            _rt.noStroke();

            for(let i = 0; i < num; i++)
            {
                _rt.fill(c[i % c.length]);
                const radius = _minRadius + (num - 1 - i) * _space;
                _rt.circle(_w / 2, _h / 2, radius * 2);
            }
        }
        return func;
    },

    /**
     * Concentric polygon stripe pattern.
     * @param {Number} _vertNum     Number of vertices in a polygon,
     *                              constrained between 3 and 20.    default = 3
     * @param {Number} _space       Stripe space. default = 10
     * @param {Number} _minRadius   Minimum radius. default = 0
     */
    stripePolygon : function(_vertNum = 3, _space = 25, _minRadius = 0)
    {
        const func = function(_w, _h, _rt = window)
		{
            _space = _rt.abs(_space);
            if(_space == 0)_space = 25;

            const vNum = _rt.int(_rt.constrain(_vertNum, 3, 30));
            const c = _rt.patternColors();

            const maxRadius = _rt.sqrt(_w * _w + _h * _h);
            const num  = _rt.ceil((maxRadius - _minRadius) / _space);

            _rt.noStroke();

            for(let i = 0; i < num; i++)
            {
                    _rt.fill(c[i % c.length]);
                    const radius = _minRadius + (num - 1 - i) * _space;

                    _rt.beginShape();
                    for(let i = 0; i < vNum; i++)
                    {
                            const rad = i * _rt.TAU / vNum;
                            const x = _w / 2 + _rt.cos(rad) * radius;
                            const y = _h / 2 + _rt.sin(rad) * radius;
                            _rt.vertex(x, y);
                    }
                    _rt.endShape(_rt.CLOSE);
            }
		}
		return func;
    },


    /**
     * Radial stripe pattern.
     * @param {Number} _angleSpan   Stripe angle space. default = PI / 4,
     * specified in radians or degrees, depending on current angleMode
     */
    stripeRadial : function(_angleSpan = 1)
    {
        const func = function(_w, _h, _rt = window)
        {
            _angleSpan = _rt.abs(_angleSpan);
            if(_angleSpan == 0)_angleSpan = 1;

            const c = _rt.patternColors();

            _rt.ellipseMode(_rt.CENTER);
            _rt.noStroke();

            let count = 0;
            const dia = _rt.sqrt(_w * _w + _h * _h);
            for(let r = 0; r < _rt.TAU; r += _angleSpan)
            {
                //Error measures
                const endRad = r + _angleSpan > _rt.TAU ? 0.00001 : r + _angleSpan;
                _rt.fill(c[count % c.length]);
                _rt.arc(_w / 2, _h /2, dia, dia, r, endRad + 0.0001);
                count++;
            }
        }
        return func;
    },


    /**
     * Wave pattern
     * patternColors()[0]       base color
     * patternColors()[1]       wave color
     * @param {Number} _waveW   Wave width. default = 100
     * @param {Number} _waveH   Wave height. default = 20
     * @param {Number} _space   Line spacing. default = 20 
     * @param {Number} _weight  Line weight. default = 5 
     */
    wave : function(_waveW = 100, _waveH = 10, _space = 20, _weight = 5)
    {
        const func = function(_w, _h, _rt = window)
        {
            _space = _rt.abs(_space);
            if(_space == 0)_space = 20;
            _waveW = _rt.abs(_waveW);
            if(_waveW == 0)_waveW = 100;

            const c = _rt.patternColors();

            const vertSpan = 3;
            _rt.rectMode(_rt.CORNER);
            _rt.noStroke();

            _rt.fill(c[0]);
            _rt.rect(0, 0, _w, _h);

            _rt.fill(c[1]);
            for(let y = -_waveH; y <= _h + _waveH; y+= _space)
            {
                _rt.beginShape();
                
                for(let x = 0; x < _w; x += vertSpan)
                {
                    const rad = x / _waveW * _rt.TAU;
                    _rt.vertex(x, y + _rt.sin(rad) * _waveH);
                }
                
                _rt.vertex(_w, y + _rt.sin(_w / _waveW * _rt.TAU) * _waveH);
                for(let x = _w; x > 0; x -= vertSpan)
                {
                    const rad = x / _waveW * _rt.TAU;
                    _rt.vertex(x, y + _weight + _rt.sin(rad) * _waveH);
                }
                _rt.vertex(0, y + _weight + _rt.sin(0) * _waveH);
                
                _rt.endShape(_rt.CLOSE);
            }
        }
        return func;
    },

    /*
    Private function.
    Generate tiling pattern functions.
    */
    _customTiling : function(_spaceX, _spaceY, _tileFunc, _useOffset = false)
    {
        const func = function(_w, _h, _rt)
        {
            _spaceX = _rt.abs(_spaceX);
            if(_spaceX == 0)_spaceX = 50;
            _spaceY = _rt.abs(_spaceY);
            if(_spaceY == 0)_spaceY = 50;

            const c = _rt.patternColors();
            _rt.rectMode(_rt.CORNER);
            _rt.noStroke();

            _rt.fill(c[0]);
            _rt.rect(0, 0, _w, _h);

            let yi = 0;
            _rt.fill(c[1]);
            for(let y = 0; y <= _h + _spaceY /2; y += _spaceY)
            {
                let xi = 0;
                let offset = yi % 2 == 1 && _useOffset ? -_spaceX / 2 : 0;
                for(let x = offset; x <= _w + _spaceX /2; x += _spaceX)
                {
                    _rt.push();
                    _rt.translate(x, y);
                    _tileFunc(_rt, xi, yi);
                    _rt.pop();
                    xi++;
                }
                yi++;
            }
        }
        return func;
    },

    /** 
     * Dot pattern 
     * patternColors()[0]       base color
     * patternColors()[1]       Checked color
     * @param {Number} _space   Dot spacing. default = 15
     * @param {Number} _dia     Dot diameter. default = 15
     */
    dot : function(_space = 15, _dia = 7)
    {
        const func = PTN._customTiling(
            _space,
            _space,
            function(_rt)
            {
                _rt.noStroke();
                _rt.ellipseMode(_rt.CENTER);
                _rt.circle(0, 0, _dia);
            },
            false
        );
        return func;
    },

     /**
     * Checked pattern
     * patternColors()[0]       base color
     * patternColors()[1]       Checked color
     * @param {Number} _checkW    Width of checkered pattern. default = 10
     * @param {Number} _checkH    Height of checkered pattern (Optional)
     */
    checked : function(...args)
    {
        let w, h;
        if(arguments.length == 0){ w = 10; h = 10;}
        else if(arguments.length == 1){w = arguments[0]; h = w;}
        else{w = arguments[0]; h = arguments[1];}

        const func = PTN._customTiling(
            w * 2,
            h,
            function(_rt)
            {
                _rt.noStroke();
                _rt.rectMode(_rt.CORNER);
                _rt.rect(0, 0, w, h);
            },
            true
        );
        return func;
    },

    /**
     * Cross pattern
     * patternColors()[1]       base color
     * patternColors()[0]       line color
     * @param {Number} _space   Line spacing. default = 20
     * @param {Number} _weight  Line weight. default = 5
     */
    cross : function(_space = 20, _weight = 5)
    {
        const func = function(_w, _h, _rt = window)
        {
            const c = _rt.patternColors();
            _rt.rectMode(_rt.CORNER);
            _rt.fill(c[0]);
            _rt.rect(0, 0, _w, _h);
            
            _rt.fill(c[1 % c.length]);
            for(let y = 0; y < _h; y+= _space)_rt.rect(0, y + _space / 2 - _weight /2, _w, _weight); 
            for(let x = 0; x < _w; x+= _space)_rt.rect(x + _space / 2 - _weight / 2, 0, _weight, _h); 
        }
        return func;
    },

    /**
     * Triangle pattern
     * patternColors()[0]       base color
     * patternColors()[1]       line color
     * @param {Number} _triW  Triangle width. default = 20
     * @param {Number} _triH  Triangle height. default = 20
     */
    triangle : function(_triW = 20, _triH = 20)
    {
        const func = PTN._customTiling(
            _triW,
            _triH,
            function(_rt)
            {
                _rt.noStroke();
                _rt.triangle(0, 0, _triW, 0, _triW /2, _triH);
            },
            true
        );
        return func;
    }

};

