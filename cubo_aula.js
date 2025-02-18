let canvas;
let gl;
let program;
let objData = null;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { 
        alert("WebGL isn't available"); 
        return; 
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.2, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    document.getElementById("file-input").addEventListener("change", handleFileSelect);
    
    render();
};

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                objData = parseOBJ(e.target.result);
                setupOBJBuffers(objData);
            } catch (error) {
                console.error("Error parsing OBJ file:", error);
            }
        };
        reader.readAsText(file);
    }
}

function parseOBJ(text) {
    const vertices = [];
    const normals = [];
    const indices = [];

    const lines = text.split('\n');
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        const parts = trimmedLine.split(/\s+/);

        if (parts[0] === 'v') {
            vertices.push(...parts.slice(1).map(Number));
        } else if (parts[0] === 'vn') {
            normals.push(...parts.slice(1).map(Number));
        } else if (parts[0] === 'f') {
            for (let j = 1; j < parts.length; j++) {
                const vertexIndices = parts[j].split('/');
                indices.push(parseInt(vertexIndices[0]) - 1);
            }
        }
    }

    return { vertices, normals, indices };
}

function setupOBJBuffers(objData) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objData.vertices), gl.STATIC_DRAW);

    const vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(objData.indices), gl.STATIC_DRAW);

    objData.indexBuffer = indexBuffer;
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    if (objData) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objData.indexBuffer);
        gl.drawElements(gl.TRIANGLES, objData.indices.length, gl.UNSIGNED_SHORT, 0);
    }
    
    requestAnimationFrame(render);
}
