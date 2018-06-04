// ColoredCube.js (c) 2012 matsuda
// Vertex shader program
var FSIZE = (new Float32Array()).BYTES_PER_ELEMENT; // size of a vertex coordinate (32-bit float)
// Vertex shader program

var VSHADER_SOURCE = null;
var FSHADER_SOURCE = null; // fragment shader program

var vertices = [];
var colors = [];
var normals = [];
var indices = [];

var ambientCount = 0;
var light_position_x = 3.3;
var specularCount = 0;


function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }


  loadFile("shader.vert", function(shader_src) {
      setShader(gl, canvas, gl.VERTEX_SHADER, shader_src); 
  });
    
  loadFile("shader.frag", function(shader_src) {
      setShader(gl, canvas, gl.FRAGMENT_SHADER, shader_src); 
  });

}

// set appropriate shader and start if both are loaded
function setShader(gl, canvas, shader, shader_src) {
    if (shader == gl.VERTEX_SHADER)
       VSHADER_SOURCE = shader_src;
    if (shader == gl.FRAGMENT_SHADER)
       FSHADER_SOURCE = shader_src;
    
    if (VSHADER_SOURCE && FSHADER_SOURCE)
       start(gl, canvas);
}

// called by 'setShader' when shaders are done loading
function start(gl, canvas) {
    // initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);
    // clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Register function event handlers
    
    //window.onkeypress = function(ev){ keypress(canvas, ev, gl); };
    //document.getElementById('update_screen').onclick = function(){ updateScreen(canvas, gl); };
    //document.getElementById('save_canvas').onclick = function(){ saveCanvas(); };
    // setup SOR object reading/writing
    //setupIOSOR("fileinput"); 

    // Set the vertex coordinates, the color and the normal
    n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    // Set the clear color and enable the depth test
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // Get the storage locations of uniform variables and so on
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
    var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
    var u_SpecularLight = gl.getUniformLocation(gl.program, 'u_SpecularLight');
    var u_shade_toggle = gl.getUniformLocation(gl.program, 'u_shade_toggle');
    var u_shine = gl.getUniformLocation(gl.program, 'u_shine');
    
    if (!u_MvpMatrix || !u_NormalMatrix || !u_LightColor || !u_LightPosition|| !u_AmbientLight || !u_SpecularLight || !u_shade_toggle) { 
        console.log('Failed to get the storage location');
        return;
    }

    // Set the light color (white)
    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    // Set the light direction (in the world coordinate)
    gl.uniform3f(u_LightPosition, 3.3, 4.0, 3.5);
    // Set the ambient light
    gl.uniform3f(u_AmbientLight, 0.0, 0.0, 0.2);
    // Set specular light
    gl.uniform3f(u_SpecularLight, 0.0, 1.0, 0.0);
    //Set shading type, Gouraud initially
    gl.uniform1i(u_shade_toggle, 0);
    //Set shininess
    gl.uniform1f(u_shine, 25.0);

    var modelMatrix = new Matrix4();  // Model matrix
    var mvpMatrix = new Matrix4();    // Model view projection matrix
    var normalMatrix = new Matrix4(); // Transformation matrix for normals

    // Calculate the model matrix
    modelMatrix.setRotate(90, 0, 1, 0); // Rotate around the y-axis
    // Pass the model matrix to u_ModelMatrix
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Pass the model view projection matrix to u_MvpMatrix
    mvpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
    mvpMatrix.lookAt(6, 6, 14, 0, 0, 0, 0, 1, 0);
    mvpMatrix.multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    // Pass the matrix to transform the normal based on the model matrix to u_NormalMatrix
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw the cube
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

function initVertexBuffers(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3

  var vertices = new Float32Array([   // Vertex coordinates
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,  // v0-v1-v2-v3 front
     1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,  // v0-v3-v4-v5 right
     1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,  // v0-v5-v6-v1 up
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,  // v1-v6-v7-v2 left
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,  // v7-v4-v3-v2 down
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0   // v4-v7-v6-v5 back
  ]);

  colors = new Float32Array([
    1, 0.2, 0.2,   1, 0.2, 0.2,   1, 0.2, 0.2,  1, 0.2, 0.2,     // v0-v1-v2-v3 front
    1, 0.2, 0.2,   1, 0.2, 0.2,   1, 0.2, 0.2,  1, 0.2, 0.2,     // v0-v3-v4-v5 right
    1, 0.2, 0.2,   1, 0.2, 0.2,   1, 0.2, 0.2,  1, 0.2, 0.2,     // v0-v5-v6-v1 up
    1, 0.2, 0.2,   1, 0.2, 0.2,   1, 0.2, 0.2,  1, 0.2, 0.2,     // v1-v6-v7-v2 left
    1, 0.2, 0.2,   1, 0.2, 0.2,   1, 0.2, 0.2,  1, 0.2, 0.2,     // v7-v4-v3-v2 down
    1, 0.2, 0.2,   1, 0.2, 0.2,   1, 0.2, 0.2,  1, 0.2, 0.2   // v4-v7-v6-v5 back
 ]);

  var indices = new Uint8Array([       // Indices of the vertices
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
  ]);

  // Create a buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) 
    return -1;

  // Write the vertex coordinates and color to the buffer object
  if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position'))
    return -1;

  if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color'))
    return -1;

  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer(gl, data, num, type, attribute) {
  var buffer = gl.createBuffer();   // Create a buffer object
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}
