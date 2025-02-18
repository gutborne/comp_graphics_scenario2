let canvas;
let gl;
let program;
const objDataArray = []; // Array to hold multiple OBJ data
let loadedCount = 0;

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

    const fileInput = document.getElementById("file-input");
    fileInput.addEventListener("change", handleFileSelect);

    render();
};

function handleFileSelect(event) {
    const files = event.target.files;
    loadedCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const objData = parseOBJ(e.target.result);
                setupOBJBuffers(objData);
                objDataArray.push(objData); // Store parsed OBJ data
            } catch (error) {
                console.error("Error parsing OBJ file:", error);
            } finally {
                loadedCount++;
                if (loadedCount === files.length) {
                    console.log("All files loaded and buffers setup.");
                }
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

    objData.positionBuffer = positionBuffer;
    objData.indexBuffer = indexBuffer;
    objData.vPosition = vPosition;
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    for (const objData of objDataArray) {
        if (objData) {
            gl.bindBuffer(gl.ARRAY_BUFFER, objData.positionBuffer);
            gl.vertexAttribPointer(objData.vPosition, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(objData.vPosition);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objData.indexBuffer);
            gl.drawElements(gl.TRIANGLES, objData.indices.length, gl.UNSIGNED_SHORT, 0);
        }
    }

    requestAnimationFrame(render);
}
