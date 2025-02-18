let canvas;
let gl;
let program;
const objDataArray = []; // Array to hold multiple OBJ data
const translations = []; // Array to hold translations for each object
const scales = []; // Array to hold scales for each object
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
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    if (!program) {
        console.error("Shader program initialization failed.");
        return;
    }
    gl.useProgram(program);

    const fileInput = document.getElementById("file-input");
    fileInput.addEventListener("change", handleFileSelect);

    render();
};

function handleFileSelect(event) {
    const files = event.target.files;
    loadedCount = 0;
    objDataArray.length = 0;
    translations.length = 0;
    scales.length = 0;

    // Parse translations
    const translationsInput = document.getElementById("translations").value;
    const translationStrings = translationsInput.split('|');
    translationStrings.forEach(translationString => {
        const translation = translationString.split(',').map(Number);
        translations.push(translation);
        scales.push(1); // Initialize scales to 1
    });

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
    const normalsPerVertex = [];

    const lines = text.split('\n');

    for (const line of lines) {
        const trimmedLine = line.trim();
        const parts = trimmedLine.split(/\s+/);

        if (parts[0] === 'v') {
            vertices.push(...parts.slice(1).map(Number));
        } else if (parts[0] === 'vn') {
            normals.push(...parts.slice(1).map(Number));
        } else if (parts[0] === 'f') {
            const faceIndices = [];

            for (let j = 1; j < parts.length; j++) {
                const vertexIndices = parts[j].split('/');
                const vertexIndex = parseInt(vertexIndices[0]) - 1;
                const normalIndex = parseInt(vertexIndices[2]) - 1;

                faceIndices.push(vertexIndex);
                normalsPerVertex[vertexIndex] = normals.slice(normalIndex * 3, normalIndex * 3 + 3);
            }

            // Triangulate faces with more than 3 vertices
            for (let j = 1; j < faceIndices.length - 1; j++) {
                indices.push(faceIndices[0], faceIndices[j], faceIndices[j + 1]);
            }
        }
    }

    return { vertices, normals: normalsPerVertex, indices };
}

function setupOBJBuffers(objData) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objData.vertices), gl.STATIC_DRAW);

    const vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objData.normals.flat()), gl.STATIC_DRAW);

    const vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(objData.indices), gl.STATIC_DRAW);

    objData.positionBuffer = positionBuffer;
    objData.normalBuffer = normalBuffer;
    objData.indexBuffer = indexBuffer;
    objData.vPosition = vPosition;
    objData.vNormal = vNormal;
}

function changeTranslation() {
    const runtimeTranslationInput = document.getElementById("runtime-translation").value;
    const [index, x, y, z] = runtimeTranslationInput.split(',').map(Number);
    if (index >= 0 && index < translations.length) {
        translations[index] = [x, y, z];
    }
}

function changeScale() {
    const runtimeScaleInput = document.getElementById("runtime-scale").value;
    const [index, scale] = runtimeScaleInput.split(',').map(Number);
    if (index >= 0 && index < scales.length) {
        scales[index] = scale;
    }
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    for (let i = 0; i < objDataArray.length; i++) {
        const objData = objDataArray[i];
        const translation = translations[i] || [0, 0, 0];
        const scale = scales[i] || 1;

        const translationLoc = gl.getUniformLocation(program, "translation");
        gl.uniform3fv(translationLoc, translation);

        const scaleLoc = gl.getUniformLocation(program, "scale");
        gl.uniform1f(scaleLoc, scale);

        if (objData) {
            gl.bindBuffer(gl.ARRAY_BUFFER, objData.positionBuffer);
            gl.vertexAttribPointer(objData.vPosition, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(objData.vPosition);

            gl.bindBuffer(gl.ARRAY_BUFFER, objData.normalBuffer);
            gl.vertexAttribPointer(objData.vNormal, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(objData.vNormal);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objData.indexBuffer);
            gl.drawElements(gl.TRIANGLES, objData.indices.length, gl.UNSIGNED_SHORT, 0);
        }
    }

    requestAnimationFrame(render); // Continuously render the scene
}
