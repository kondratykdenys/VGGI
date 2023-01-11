'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.

let point;
let texturePoint;
let scalingKoef;

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iTextureBuffer = gl.createBuffer();
    this.count = 0;
    this.countTexture = 0;

    this.BufferData = function (vertices, textures) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length / 3;

        if (textures != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textures), gl.STREAM_DRAW);

            this.countTexture = textures.length / 2;
        }


    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexture, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexture);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count);
    }

    this.DisplayPoint = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.drawArrays(gl.LINE_STRIP, 0, this.count);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    this.iAttribTexture = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.iTranslatePoint = -1;
    this.iTexturePoint = -1;
    this.iScalingKoef = -1;
    this.iTMU = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.orthographic(-4, 4, -4, 4, 0, 4 * 4);


    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

    gl.uniform1i(shProgram.iTMU, 0);
    gl.enable(gl.TEXTURE_2D);
    gl.uniform2fv(shProgram.iTexturePoint, [texturePoint.x, texturePoint.y]);
    gl.uniform1f(shProgram.iScalingKoef, scalingKoef);
    surface.Draw();
    let tr = CTSC(map(texturePoint.x, 0, 1,0, Math.PI*2), map(texturePoint.y, 0, 1, -1, 1))
    gl.uniform3fv(shProgram.iTranslatePoint, [tr.x, tr.y, tr.z]);
    gl.uniform1f(shProgram.iScalingKoef, -scalingKoef);
    point.DisplayPoint();
}

function CreateSurfaceData() {
    let vertexList = [];
    const uMax = Math.PI * 2
    const vMax = 1;
    const step = 0.1
    for (let v = -vMax; v < vMax; v += step) {
        for (let u = 0; u < uMax; u += step) {
            let v0 = CTSC(u, v)
            let v1 = CTSC(u + step, v)
            let v2 = CTSC(u, v + step)
            let v3 = CTSC(u + step, v + step)
            vertexList.push(v0.x, v0.y, v0.z)
            vertexList.push(v1.x, v1.y, v1.z)
            vertexList.push(v2.x, v2.y, v2.z)

            vertexList.push(v1.x, v1.y, v1.z)
            vertexList.push(v3.x, v3.y, v3.z)
            vertexList.push(v2.x, v2.y, v2.z)
        }
    }

    return vertexList;
}
function CreateSurfaceTextureData() {
    let textureList = [];
    const uMax = Math.PI * 2
    const vMax = 1;
    const step = 0.1
    for (let v = -vMax; v < vMax; v += step) {
        for (let u = 0; u < uMax; u += step) {
            let u1 = map(u, 0, uMax, 0, 1)
            let v1 = map(v, -vMax, vMax, 0, 1)
            textureList.push(u1, v1)
            u1 = map(u + step, 0, uMax, 0, 1)
            textureList.push(u1, v1)
            u1 = map(u, 0, uMax, 0, 1)
            v1 = map(v + step, -vMax, vMax, 0, 1)
            textureList.push(u1, v1)
            u1 = map(u + step, 0, uMax, 0, 1)
            v1 = map(v, -vMax, vMax, 0, 1)
            textureList.push(u1, v1)
            v1 = map(v + step, -vMax, vMax, 0, 1)
            textureList.push(u1, v1)
            u1 = map(u, 0, uMax, 0, 1)
            v1 = map(v + step, -vMax, vMax, 0, 1)
            textureList.push(u1, v1)
        }
    }

    return textureList;
}

function CTSC(u, v) {
    let k = 0.5
    let x = r(u, v) * Math.cos(u)
    let y = r(u, v) * Math.sin(u)
    let z = v
    return { x: k * x, y: k * y, z: k * z }
}

function r(u, v) {
    const a = 3
    let r1 = c(v, 2) * Math.cos(2 * u)
    let r2 = Math.sqrt(Math.pow(a, 4) - c(v, 4) * Math.pow(Math.sin(2 * u), 2))
    return (Math.sqrt(r1 + r2))
}

function c(v, p = 1) {
    return Math.pow(3 * v, p)
}

function CreateSphereSurface(r = 0.05) {
    let vertexList = [];
    let lon = -Math.PI;
    let lat = -Math.PI * 0.5;
    while (lon < Math.PI) {
        while (lat < Math.PI * 0.5) {
            let v1 = sphereSurfaceDate(r, lon, lat);
            vertexList.push(v1.x, v1.y, v1.z);
            lat += 0.05;
        }
        lat = -Math.PI * 0.5
        lon += 0.05;
    }
    return vertexList;
}

function sphereSurfaceDate(r, u, v) {
    let x = r * Math.sin(u) * Math.cos(v);
    let y = r * Math.sin(u) * Math.sin(v);
    let z = r * Math.cos(u);
    return { x: x, y: y, z: z };
}

/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iAttribTexture = gl.getAttribLocation(prog, "texture");
    shProgram.iTranslatePoint = gl.getUniformLocation(prog, 'translatePoint');
    shProgram.iTexturePoint = gl.getUniformLocation(prog, 'texturePoint');
    shProgram.iScalingKoef = gl.getUniformLocation(prog, 'scalingKoef');
    shProgram.iTMU = gl.getUniformLocation(prog, 'tmu');

    surface = new Model('Surface');
    LoadTexture()
    surface.BufferData(CreateSurfaceData(), CreateSurfaceTextureData());
    point = new Model('Point');
    point.BufferData(CreateSphereSurface(), null)

    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    texturePoint = { x: 0.5, y: 0.5 }
    scalingKoef = 1.0;
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    draw()
}

function map(val, f1, t1, f2, t2) {
    let m;
    m = (val - f1) * (t2 - f2) / (t1 - f1) + f2
    return Math.min(Math.max(m, f2), t2);
}

function LoadTexture() {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const image = new Image();
    image.crossOrigin = 'anonymus';

    image.src = "https://raw.githubusercontent.com/kondratykdenys/VGGI/main/%D0%B7%D0%B0%D0%B2%D0%B0%D0%BD%D1%82%D0%B0%D0%B6%D0%B5%D0%BD%D0%BD%D1%8F.jpg";
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        console.log("imageLoaded")
        draw()
    }
}

window.onkeydown = (e) => {
    switch (e.keyCode) {
        case 87:
            texturePoint.x -= 0.01;
            break;
        case 83:
            texturePoint.x += 0.01;
            break;
        case 65:
            texturePoint.y += 0.01;
            break;
        case 68:
            texturePoint.y -= 0.01;
            break;
    }
    texturePoint.x = Math.max(0.001, Math.min(texturePoint.x, 0.999))
    texturePoint.y = Math.max(0.001, Math.min(texturePoint.y, 0.999))
    draw();
}

onmousemove = (e) => {
    scalingKoef = map(e.clientX, 0, window.outerWidth, 0, Math.PI)
    draw()
};