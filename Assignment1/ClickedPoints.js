// ClickedPints.js (c) 2012 matsuda
// Vertex shader program

//Global
var mouse_xy = new Float32Array(500);
var g_points = []; // The array for the position of a mouse press
var right_click = false;
var canvas;
var gl;
var a_Position;
var counter = 0;
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform int u_Invert;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  if (u_Invert == 0) {\n' +
  '  v_Color = vec4(1.0, 0.0, 0.0, 1.0);\n'+
  ' }\n' +
  '  else {\n'+
  '  v_Color = vec4(0.0, 1.0, 1.0, 1.0);\n'+
  '  }\n' +

  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'void main() {\n' +
  '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +

  '}\n';

function main() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = function(ev){click(ev, gl, canvas, a_Position); };
  window.onkeypress = function(ev){ keypress(ev, gl); };
  canvas.addEventListener('mousemove',function(ev){draw_line(ev,gl,canvas, a_Position)});
 //initUniforms(gl);
  
  //mouse movement
  //canvas.addEventListener('movingmouse',function(ev){follow_mouse(ev,gl,canvas, a_Position)};
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

// uniform variable locations: made global for easy access and modification
var u_Invert; // invert colors globally (int (used as bool))
var u_Flip;   // flip all translated_vert over specified 2D dir (within xy-plane z=0) (int (used as bool))
var u_FlipDir; // direction to flip points over origin (float vec2)

// initializes uniforms
function initUniforms(gl) {
    u_Invert = gl.getUniformLocation(gl.program, 'u_Invert');
    u_Flip = gl.getUniformLocation(gl.program, 'u_Flip');
    u_FlipDir = gl.getUniformLocation(gl.program, 'u_FlipDir');
    if (!u_Invert || !u_Flip) {
  console.log("failed to get storage location of uniform");
  return false;
    }
    // set default values
    gl.uniform1i(u_Invert, 0); // no invert
    gl.uniform1i(u_Flip, 0); // no flip 
    gl.uniform2f(u_FlipDir, 1, 1); // diagonal
    return true;
}

// Called when user presses a key
function keypress(ev, gl) {
    console.log("in keypress");
    if (ev.which == "q".charCodeAt(0)) gl.uniform1i(u_Invert, 0); // Set invert variable to false
    if (ev.which == "w".charCodeAt(0)) gl.uniform1i(u_Invert, 1); // Set invert variable to true
    if (ev.which == "a".charCodeAt(0)) gl.uniform1i(u_Flip, 0); // Set flip variable to false
    if (ev.which == "s".charCodeAt(0)) gl.uniform1i(u_Flip, 1); // Set flip variable to true
    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
      var vertices = initVertexBuffers(gl, ev, canvas, a_Position, vertices);
  if (vertices < 0){
      console.log('Failed to set the positions of the vertices');
      return;
  }
  gl.drawArrays(gl.POINTS, 0, ((counter)/2));
  gl.drawArrays(gl.LINE_STRIP, 0, ((counter)/2));
    // Draw polyline
    //draw_line(ev,gl,canvas, a_Position);
}

function click(ev,gl,canvas,a_Position){
    var x = ev.clientX; //x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
    
    if(right_click == false){        
      x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
      y = (canvas.height/2 - (y - rect.top))/(canvas.height/2); 

    
    incrementArray(x, y);
    g_points.push([x, y]);
        
    console.log("You left-clicked at (" +x+ ", "+y+ ")");
    }
    
       var n = initVertexBuffers(gl, ev, canvas, a_Position, n);
        if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }

        
    //print out list of all coordinates from array
    if(ev.button==2 && right_click == false){
        console.log("Right-clicked: (" + ev.clientX + ", " + ev.clientY + ")."); 
        console.log("All coordinates in order: " + "\n");
        for(var i=0; i<g_points.length; i++){
            console.log("("+g_points[i]+")" + "\n");
        }
        right_click = true;
    }
       
      gl.clear(gl.COLOR_BUFFER_BIT);
    
      gl.drawArrays(gl.POINTS, 0, ((counter)/2)); 
      gl.drawArrays(gl.LINE_STRIP, 0, counter/2);
   
}

function draw_line(ev, gl, canvas, a_Position) {

  if(right_click)return true;

  if (counter < 2)
    return;
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect() ;

  if(counter > 2)
  {
    counter = counter - 2;
  }

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  incrementArray(x, y);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = mouse_xy.length;
  for(var i = 0; i < len; i += 2) {
    gl.vertexAttrib3f(a_Position, mouse_xy[i], mouse_xy[i+1], 0.0);

  }
  var vertices = initVertexBuffers(gl, ev, canvas, a_Position, vertices);
  if (vertices < 0){
      console.log('Failed to set the positions of the vertices');
      return;
  }
  gl.drawArrays(gl.POINTS, 0, ((counter)/2));
  gl.drawArrays(gl.LINE_STRIP, 0, ((counter)/2));
}

function initVertexBuffers(gl, ev, canvas, a_Position, n) {
  var vertices = new Float32Array([
    0, 0.5,   -0.5, -0.5,   0.5, -0.5
  ]);
  var n = mouse_xy.length/2;

  if(right_click == true)
  {
    n = g_points.length/2;
  }

  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, mouse_xy, gl.STATIC_DRAW);
     
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(a_Position);

  return n;



}
function incrementArray(x, y){
    mouse_xy[counter]=x;
    counter++;
    mouse_xy[counter]=y;
    counter++;
}