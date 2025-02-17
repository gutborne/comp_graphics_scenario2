
var canvas;
var gl;

var NumVertices  = 36;

var vertices = [
    vec3(0.5,   0.5,   0.5),//0
    vec3(-0.5,  0.5,   0.5),//1
    vec3(-0.5, -0.5,  0.5),//2
    vec3(0.5,  -0.5,  0.5),//3
    vec3(0.5,   0.5, -0.5),//4
    vec3(-0.5,  0.5, -0.5),//5
    vec3(-0.5, -0.5, -0.5),//6
    vec3(0.5,  -0.5, -0.5) //7
];
var faces = [
    [0, 1, 2, 3],
    [4, 7, 6, 5],
    [0, 4, 5, 1],
    [1, 5, 6, 2],
    [2, 6, 7, 3],
    [3, 7, 4, 0]
];
var cores = [
    vec3(1.0, 0.0, 0.0),
    vec3(0.0, 1.0, 0.0),
    vec3(0.0, 0.0, 1.0),
    vec3(1.0, 1.0, 0.0),
    vec3(1.0, 0.0, 1.0),
    vec3(1.0, 1.0, 0.0)
];
var sh_colors = [];//36
var sh_vertices =  [];//36
function create_cube(){
    for(var f = 0; f < faces.length; f++){
        a = faces[f][0];
        b = faces[f][1];
        c = faces[f][2];
        d = faces[f][3];
        sh_vertices.push(vertices[a]);
        sh_vertices.push(vertices[b]);
        sh_vertices.push(vertices[c]);
        sh_vertices.push(vertices[a]);
        sh_vertices.push(vertices[c]);
        sh_vertices.push(vertices[d]);
        for(var c = 0; c < 6;  c++){
            sh_colors.push(cores[f]);
        }
    }
}
window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    //criar o cubo
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);
    
    //  Linka e compila os shaders
    var program = initShaders( gl, "vertex-shader", "fragment-shader");
    gl.useProgram( program );
    
    create_cube();
    //Vértices
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(sh_vertices), gl.STATIC_DRAW);    
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    //cor
    
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(sh_colors), gl.STATIC_DRAW);    
    
    var vColor = gl.getAttribLocation( program, "vColor");
    gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(vColor);
    //...
    render();
    //create_cube();
}

function render()
{
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
    requestAnimFrame( render );
}

