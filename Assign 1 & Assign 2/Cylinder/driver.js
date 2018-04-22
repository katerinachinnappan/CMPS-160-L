// drawing a single quad (rectangular polygon) with two triangles

var FSIZE = (new Float32Array()).BYTES_PER_ELEMENT; // size of a vertex coordinate (32-bit float)
var VSHADER_SOURCE = null; // vertex shader program
var FSHADER_SOURCE = null; // fragment shader program
var POLYGON_SIDES = 12;

var right_mouseClick = false;
var translated_vert = [];   //rotated points after being translated to clicked points
var g_points = new Float32Array(500);
var count=0;
var a_Position;
var gl;
var pi = Math.PI;
var radius = .105;
var canvas;
var n = 0; //# of vertexes in g_points
var coordinates = [];  //array to store all the coordinates 
// called when page is loaded
function main() {
    // retrieve <canvas> element
    canvas  = document.getElementById('webgl');
    // get the rendering context for WebGL
    gl = getWebGLContext(canvas);
    if (!gl) {
	console.log('Failed to get the rendering context for WebGL');
	return;
    }
    // load shader files (calls 'setShader' when done loading)
    loadFile("shader.vert", function(shader_src) {
	setShader(gl, canvas, gl.VERTEX_SHADER, shader_src); });
    loadFile("shader.frag", function(shader_src) {
	setShader(gl, canvas, gl.FRAGMENT_SHADER, shader_src); });
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
    // clear <canvas> 
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT); 
    // Register function event handlers
    canvas.onmousedown = function(ev){ click(ev, gl, canvas); };
    canvas.addEventListener('mousemove',function(ev){mouse_direction(ev)}); 
    window.onkeypress = function(ev){ keypress(ev, gl); };
    document.getElementById('update_screen').onclick = function(){ updateScreen(canvas, gl); };
    document.getElementById('save_canvas').onclick = function(){ saveCanvas(); };
    document.getElementById('reset_canvas').onclick = function(){ resetCanvas(canvas, gl); };
    // setup SOR object reading/writing  
    setupIOSOR("fileinput"); 
}


// initialize vertex buffer
function initVertexBuffer(gl) {
    // create buffer object
    var vertex_buffer = gl.createBuffer();
    if (!vertex_buffer) {
	console.log("failed to create vertex buffer");
	return false;
    }
    // bind buffer objects to targets
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    return true;
}

// initialize count buffer
function initcountBuffer(gl) {
    // create buffer object
    var count_buffer = gl.createBuffer();
    if (!count_buffer) {
	console.log("failed to create count buffer");
	return false;
    }
    // bind buffer objects to targets
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, count_buffer);
    return true;
}

// set data in vertex buffer (given typed float32 array)
function setVertexBuffer(gl, translated_vert) {
    gl.bufferData(gl.ARRAY_BUFFER, translated_vert, gl.STATIC_DRAW);
}

// set data in count buffer (given typed uint16 array)
function setcountBuffer(gl, indices) {
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
}

// initializes attributes
function initAttributes(gl) {
    // assign buffer to a_Position and enable assignment
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
    if (a_Position < 0 || a_PointSize < 0) {
	console.log("failed to get storage location of attribute");
	return false;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 4, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.vertexAttribPointer(a_PointSize, 1, gl.FLOAT, false, FSIZE * 4, FSIZE * 3);
    gl.enableVertexAttribArray(a_PointSize);
    return true;
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
    // Draw polyline
    drawPolyline(ev);
}

function helper_mouse_follow(g_points, count, x, y){
      g_points[count]=x;
      count++;
      g_points[count]=y;
      count++; 
      count-=2;
}
// Called when user clicks on canvas
function click(ev, gl, canvas) {
    if(right_mouseClick) return;
    console.log("in Click");
    //if(right_mouseClick) return;
    var x = ev.clientX; //x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
    
    if(ev.button==0 && right_mouseClick == false){       
    //convert coordinates to canvas plane
      x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
      y = (canvas.height/2 - (y - rect.top))/(canvas.height/2); 

    //store coordinates in g_points array
      g_points[count]=x;
      count++;
      g_points[count]=y;
      count++;
      console.log("Left click: " + "x: " + x + "y: " + y); 
        // Clear canvas
      //gl.clear(gl.COLOR_BUFFER_BIT);
      
      helper_mouse_follow(g_points, count, x, y);
      
    }
            
    if(ev.button==2 && right_mouseClick == false){
        //gl.clear(gl.COLOR_BUFFER_BIT);
        console.log("Right click: " + "x: " + x + "y: " + y);  
 
        right_mouseClick = true;
    }
 drawPolyline(ev);
}

function mouse_direction(ev){
    if(right_mouseClick) return; //prevent the rubber band when right clicked
    var x = ev.clientX; //x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
    
    x = ((x-rect.left)-canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2-(y-rect.top))/(canvas.height/2);
    
    helper_mouse_follow(g_points, count, x, y);
    drawPolyline(ev);
}

function drawPolyline(ev){
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawPolyline1();
    if (ev.button == 2){
        console.log("You right-clicked!!! drawPolyLome");
        //Start drawing cylinder here. 
        setup_cylinder();

    }
}

function drawPolyline1(){
    var n = count/2; //Number of coordinate pairs
    

    //Create buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer){
        console.log('Failed to create the buffer object');
        return false;
    }
    
    //bind buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, g_points, gl.STATIC_DRAW);
    
    //a_Position to shader
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.drawArrays(gl.LINE_STRIP, 0, count/2 + 1);//Draw lines
    return true;
}

//x y z array stored as 24 indecies.
function xyz_coourdinate_count(){
   for(var i = 0; i < POLYGON_SIDES; i++){
       //corner intersection
       coordinates.push([((i) % POLYGON_SIDES)]);
       //connect the spines
       coordinates.push([((i+i) % POLYGON_SIDES)]);
       //intersection
       coordinates.push([(((i+i) % POLYGON_SIDES) + POLYGON_SIDES)]);
       //final diagonal
       coordinates.push([(((i) % POLYGON_SIDES) + POLYGON_SIDES)]);
   }
   console.log('coordinates length: ' + coordinates.length);
   volumeCylinder(coordinates);

    return coordinates;
}

//rotation
//Rotate the points around the origin
//push into the rotated cylinder array.
function rotateCylinder(n){
    
    //x y z for the cylinder.
    var x = 0;     
    var y = 0;
    var z = 0;
    var pCylinder = []; //array to store the rotated cylinder points

    //the smaller the radius -- the "thinner" the cylinder is.

    var Mx = g_points[n-2];    
    var Y = g_points[n-1];

    var Mx2 = g_points[n-4];
    var Y2 = g_points[n-3];

    
    //find rotated(flipped) x y z and store in the rotated array.
    //used https://stackoverflow.com/questions/43641798/how-to-find-x-and-y-coordinates-on-a-flipped-circle-using-javascript-methods
    //as reference.
    for(var theta = 0; theta < 
        2* (pi); theta+= 2 *(pi * (1/12))){

        z = radius * Math.sin(theta);
        y = radius * Math.cos(theta);

        pCylinder.push(x);
        pCylinder.push(y);
        pCylinder.push(z);
    }
    rotate_points(pCylinder, Mx, Y, Mx2, Y2);
}

function rotate_points(pCylinder, Mx, Y, Mx2, Y2){
    //slope 
    var slope = (Y - Y2) / (Mx - Mx2); 
    var theta = Math.atan(slope); // thetha
    var length = Math.sqrt(Math.pow((Mx - Mx2), 2) + Math.pow((Y-Y2), 2));


    //translate x y coords
    var rotated_points = [];
    for(var j = 0; j < pCylinder.length; j+=3)
    {
        rotated_points.push((pCylinder[j] * length * Math.cos(theta)) 
            - (pCylinder[j+1] * Math.sin(theta)));
        rotated_points.push((pCylinder[j] * length * Math.sin(theta)) 
            + (pCylinder[j+1] * Math.cos(theta)));
        rotated_points.push(pCylinder[j+2]);
    }
    
    if(Mx - Mx2 < 0)
    {
        for(var j = 0; j < rotated_points.length; j+=3)
        {
            rotated_points[j] = -rotated_points[j];
            rotated_points[j+1] = -rotated_points[j+1];
        }
    }
    
    //translate vertex; push into array
    translate_vertex(pCylinder, Mx, Y, Mx2, Y2, rotated_points);
}

function translate_vertex(pCylinder, Mx, Y, Mx2, Y2, rotated_points){

    for(var i = 0; i < pCylinder.length ; i += 3)
    {
        translated_vert[i + pCylinder.length] = rotated_points[i] + Mx;
        translated_vert[i+1 + pCylinder.length] = rotated_points[i+1] + Y;
        translated_vert[i+2 + pCylinder.length] = rotated_points[i+2];
    }

    for(var i = 0; i < pCylinder.length; i += 3)
    {
        translated_vert[i] = rotated_points[i] + Mx2;
        translated_vert[i+1] = rotated_points[i+1] + Y2;
        translated_vert[i+2] = rotated_points[i+2];
    }

}

function createBufferCylinder(gl){
    //Create buffer object
    var vertexBuffer = gl.createBuffer();
        if (!vertexBuffer){
            console.log('Failed to create the buffer object');
            return false;
        }

    var countBuffer = gl.createBuffer();
    bindBufferCylinder(vertexBuffer, countBuffer);
    

}

function bindBufferCylinder(vertexBuffer, countBuffer){
    //bind buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, countBuffer);

}

function bufferDataCylinder(gl){
    var arr = new Uint16Array(coordinates);
    var translatedArr = new Float32Array(translated_vert);

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, arr, gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, translatedArr, gl.STATIC_DRAW);

    return arr;

}

//helper function to begin draw cylinder
function setup_cylinder(){
    console.log('setup cylinder');
    for(var i = 4; i <= count; i += 2){
        console.log('setup cylinder');
        xyz_coourdinate_count();
        rotateCylinder(i); 

        //Create buffer object. This is going to call another chain
        //of functions.
        createBufferCylinder(gl);

        // push to buffer data
        var arr = bufferDataCylinder(gl);

        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
                
        gl.drawElements(gl.LINE_STRIP, arr.length, gl.UNSIGNED_SHORT, 0);

      }
      return true;
}

/*volume of Cylinder: v = pi r^(2) h*/
function volumeCylinder(coordinates){
    var volume = (pi) * ((radius * radius) * coordinates.length);
    console.log('Volume of Cylinder: ' + volume);

}

// Draws connected rectangles between clicked points
function drawRectangles(gl) {
    var n = g_points.length - 1; // Number of rectangles
    var vert = [];
    var ind = [];
    // Draw each individual rectangle separately
    /* NOTE: You can also draw them all at once (single call to 'drawElements') if you want */
    for (i = 0; i < n; ++i) {
	// First corner of rectangle
	vert.push(g_points[i*4]); // x coord
	vert.push(g_points[i*4 + 1]); // y coord
	vert.push(0); // z coord
	vert.push(1); // Point size
	ind.push(0);
	// Second corner of rectangle
	vert.push(g_points[i*4]);
	vert.push(g_points[(i+1)*4 + 1]);
	vert.push(0);
	vert.push(1);
	ind.push(1);
	// Third corner of rectangle
	vert.push(g_points[(i+1)*4]);
	vert.push(g_points[(i+1)*4 + 1]);
	vert.push(0);
	vert.push(1);
	ind.push(2);
	// Fourth corner of rectangle
	vert.push(g_points[(i+1)*4]);
	vert.push(g_points[i*4 + 1]);
	vert.push(0);
	vert.push(1);
	ind.push(3);
	// Connect First corner again to wrap lines around
	ind.push(0);
	// Set translated_vert
	setVertexBuffer(gl, new Float32Array(vert));
	var n = ind.length;
	// Set indices
	setcountBuffer(gl, new Uint16Array(ind));
 	// Draw rectangle
	gl.drawElements(gl.LINE_STRIP, n, gl.UNSIGNED_SHORT, 0);
	// Reset translated_vert and indices
	vert = [];
	ind = [];
    }
}

// loads SOR file and draws object
function updateScreen(canvas, gl) {
    canvas.onmousedown = null; // disable mouse
    var sor = readFile();      // get SOR from file
    translated_vert = sor.vertices;
    coordinates = sor.indexes;

    gl.clear(gl.COLOR_BUFFER_BIT);
            
    var vertexBuffer = gl.createBuffer();
    var indexBuffer = gl.createBuffer();
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, translated_vert, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, coordinates, gl.STATIC_DRAW);
    
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.drawElements(gl.LINE_STRIP, coordinates.length/2, gl.UNSIGNED_SHORT, 0);
}

// saves polyline displayed on canvas to file
function saveCanvas() {
   var sor = new SOR();
   sor.objName = "model";
   sor.vertices = g_points;
   sor.indexes = [];

   for (i = 0; i < g_points.length; i = i + 3){
    sor.indexes.push(i);
    sor.indexes.push(i + 1);
    sor.indexes.push(i + 2);
}
   console.log(sor.indexes);
   saveFile(sor);
}

// clears canvas
function resetCanvas(canvas, gl) {
    console.log('Reseting canvas');
    g_points = new Float32Array(500);
    //main();
    gl.clear(gl.COLOR_BUFFER_BIT);
}


