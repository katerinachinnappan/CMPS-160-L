//global variables
var FSIZE = (new Float32Array()).BYTES_PER_ELEMENT; // size of a vertex coordinate (32-bit float)
var VSHADER_SOURCE = null; // vertex shader program
var FSHADER_SOURCE = null; // fragment shader program
var POLYGON_SIDES = 12;

var g_points = new Float32Array(500); 
var right_mouseClick = false;
var a_Position;
var a_Color;
var center_cylinder_vertex = [];   
var translated_vert = [];   
var gouraud_vert = []; // for gouraud shading 
var coordinates = [];  // coordinates of stored points
var norms_array_vec = [];  
var direction_color_point = [1.0, 1.0, 1.0];
var normal_color = [1, 0, 0];
var count=0;
var gl;
var n = 0; 
var alpha = .50;
var canvas;
var display_normal = false;
var change_light = false;
var normalized_vertices = [];
var normal_point_color = [];
var centers = [];
var lighting_on_surface = [];
var normalized_light = [];
var colorShade = [];
var color = [1, 0, 0];
var roatatedPoints;
var normalized_vec_array = [];
var normalized_gouraud_vec_array = [];
var normal_each_vertex = [];
var gouraud_shaded_vertices = [];
var specular_coef; 
var specular_lightt = [0, 1, 0];
var specular_shading = [];
var check_specular = false;
var picked = null; // picked object
var objectList = [];
var translate = false;
var x_start, y_start;
var verticies_array = [];
var rotate = false;
var translated_matricies = [];
var rotated_matricies= [];

function main(){
    
    console.log("started");
    
    
    //Retreive <canvas> element
     canvas = document.getElementById('webgl');

    //Get the rendering context for WebGL
    gl = WebGLUtils.setupWebGL(canvas,{preserveDrawingBuffer: true});
    if(!gl){
        console.log('Failed to get redering context for WebGL');
        return;
    }

    // load shader files (calls 'setShader' when done loading)
    loadFile("shader.vert", function(shader_src) {
    setShader(gl, canvas, gl.VERTEX_SHADER, shader_src); });
    loadFile("shader.frag", function(shader_src) {
    setShader(gl, canvas, gl.FRAGMENT_SHADER, shader_src); });
}

function setShader(gl, canvas, shader, shader_src) {
    if (shader == gl.VERTEX_SHADER)
    VSHADER_SOURCE = shader_src;
    if (shader == gl.FRAGMENT_SHADER)
    FSHADER_SOURCE = shader_src;
    if (VSHADER_SOURCE && FSHADER_SOURCE)
    start(gl, canvas);
}

function start(gl, canvas){
    //initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }
    
    
    // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }
    
    a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if(a_Color < 0){
        console.log('Failed to get the storage location of a_Color');
        return; 
    }
        
    canvas.onmousedown = function(ev){click(ev)};
    canvas.addEventListener('mousemove',function(ev){mouse_direction(ev)});
    document.getElementById('update_screen').onclick = function(){ updateScreen(canvas, gl); };
    document.getElementById('save_canvas').onclick = function(){ saveCanvas(); };
    document.getElementById('reset_canvas').onclick = function(){ resetCanvas(canvas, gl); };
     
    
    
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    
    gl.enable(gl.DEPTH_TEST);
    
    
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

function helper_mouse_follow(g_points, count, x, y){
      g_points[count]=x;
      count++;
      g_points[count]=y;
      count++; 
      count-=2;
}

function click(ev){
    var x = ev.clientX; //x coordinate 
    var y = ev.clientY; // y coordinate
    var rect = ev.target.getBoundingClientRect();
    
    if(right_mouseClick){ 
        if(rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom){
            var x_canvas = x - rect.left;
            var y_canvas = rect.bottom - y;

            var pixel = new Uint8Array(4);
            gl.readPixels(x_canvas, y_canvas, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

            if(pixel[3] != 255){
                for(var i = 0; i < objectList.length; i++){
                    var pixel_left = Math.round((255 * (.97 - (i*.01))));
                    if(pixel_left == pixel[3]){
                        picked = i;
                    }
                }
            }
            else{
                picked = null;
            }
            console.log('pixel_color: ' + pixel);
        }
        
        drawPolyline();
        return;  
    }
    
    if(ev.button==0 && right_mouseClick == false){        
    //convert coordinates to canvas plane
      x = (((x - rect.left) - canvas.width/2)/(canvas.width/2)) *500;
      y = ((canvas.height/2 - (y - rect.top))/(canvas.height/2)) *500; 
        

      g_points[count]=x;
      count++;
      g_points[count]=y;
      count++;

      helper_mouse_follow(g_points, count, x, y);
        
    }
    
    if(ev.button==2 && right_mouseClick == false){
        xyz_coordinate_count();
        transform_cylinder();

        addPickObject();


        right_mouseClick = true;
    }

   drawPolyline();
}

function mouse_direction(ev){
    
    if(right_mouseClick) {
        return;
    }
    var x = ev.clientX; //x coordinate 
    var y = ev.clientY; // y coordinate 
    var rect = ev.target.getBoundingClientRect();

    
    // Convert coordinates to canvas plane
    x = (((x-rect.left)-canvas.width/2)/(canvas.width/2)) *500;
    y = ((canvas.height/2-(y-rect.top))/(canvas.height/2)) *500;
    
    helper_mouse_follow(g_points, count, x, y);
    drawPolyline();
}

    
//start to draw the flat cylinder and check for surface normal
function drawPolyline(){
    uMatrix();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    alpha = .97;
    drawPolyline1();
    if(right_mouseClick == true){
        for(var i = 0; i < objectList.length; i++){
            setup_cylinder(i, alpha);
            alpha -= .01;
        }
        if(display_normal == true){
            drawSurfaceNormals();
        }
        if(change_light == true){
            console.log("change light == true");
        }
    }
}

function normalize_vector(vector){
    var normal_vector = [];
    var length = vector_magnitude(vector);
    
    for(var i = 0; i < vector.length; i++){
        normal_vector.push(vector[i]/length);
    }
    return normal_vector;
}


function check_normal(e) {
    display_normal = e.checked;
    drawPolyline();
}

function check_light(e) {
    display_normal = e.checked;
    drawPolyline();
}

function vector_dot_product(vector1, vector2){
    var thevector_dot_product = 0;
    for(var i = 0; i < vector1.length; i++){
        thevector_dot_product += vector1[i] * vector2[i];
    }
    return thevector_dot_product;
}


function vector_by_scalar(vector, scalar){
    var scaledVector = [];
    for(var i = 0; i < vector.length; i++){
        scaledVector.push(scalar * vector[i]);
    }
    return scaledVector;
}

function vector_magnitude(vector){
    var total = 0;

    for (var i = 0; i < vector.length; i++){
        total = total + Math.pow(vector[i], 2);
    }
    return Math.sqrt(total);
}

function cross_vector_produce(vector1, vector2){
    var cross_vector_produce = [];
    cross_vector_produce.push((vector1[1] * vector2[2]) - (vector2[1] * vector1[2]));
    cross_vector_produce.push((vector2[0] * vector1[2]) - (vector1[0] * vector2[2]));
    cross_vector_produce.push((vector1[0] * vector2[1]) - (vector2[0] * vector1[1]));
    return cross_vector_produce;
}



function normalized_vertices_surface_helper(normalized_vertices_surfaceArray, Xpoint){
    normalized_vertices_surfaceArray.push(translated_vert[Xpoint * 3]);
    normalized_vertices_surfaceArray.push(translated_vert[(Xpoint * 3) + 1]);
    normalized_vertices_surfaceArray.push(translated_vert[(Xpoint * 3) + 2]);
}

function gouraud_vertice_normal_helper(normalized_gouraud_vec_array, Xpoint){
    normalized_gouraud_vec_array.push(gouraud_vert[Xpoint * 3]);
    normalized_gouraud_vec_array.push(gouraud_vert[(Xpoint * 3) + 1]);
    normalized_gouraud_vec_array.push(gouraud_vert[(Xpoint * 3) + 2]);
}

function gouraud_shaded_norms(){
    console.log('in gouraud shaded norms')
    normalized_gouraud_vec_array = [];
    for(var i = 0; i < coordinates.length; i++){
        var Xpoint = coordinates[i];
        gouraud_vertice_normal_helper(normalized_gouraud_vec_array, Xpoint);
    }
}

function transform_cylinder(){
    translated_vert = [];
    var approximateThetas = [];
    var approximateThetas2 = [];
    var theta_ = [];

    var Xpoint = count_cylinders();
    approximateThetas2.push(calc_lighting_1(4));
    for(var i = 6; i <= count; i+=2){
        approximateThetas2.push(calc_lighting_2(i));
    }
    approximateThetas2.push(calc_lighting_1(count));

}

function count_cylinders(n){
    var Xpoint = [];
    var radius = 50;

    var x = 0, y = 0, z = 0;

    for(var theta = 2 * (Math.PI); theta > 0; theta -= 2 * (
        Math.PI * (1.0/POLYGON_SIDES))){
        z = radius * Math.cos(theta);
        y = radius * Math.sin(theta);
        Xpoint.push(x);
        Xpoint.push(y);
        Xpoint.push(z);

    }
    return Xpoint;
}

function calc_normals_vertex(){
    gouraud_vert = [];
    normal_each_vertex = [];

    for(var i = 0; i < translated_vert.length / 3; i++){
        normal_each_vertex.push([]);
    }

    for(var i = 0; i < coordinates.length; i+=3){
        var Xpoint = coordinates[i];
        var Ypoint = coordinates[i+1];
        var Zpoint = coordinates[i+2];

        var normals_surfaces = ([norms_array_vec[i], 
            norms_array_vec[i+1], norms_array_vec[i+2]]);

        normal_each_vertex[Xpoint].push(normals_surfaces);
        normal_each_vertex[Ypoint].push(normals_surfaces);
        normal_each_vertex[Zpoint].push(normals_surfaces);
    }

    for(var i = 0; i < translated_vert.length /3; i++){
        var temp = countVectors(normal_each_vertex[i]);
        gouraud_vert.push(temp[0]);
        gouraud_vert.push(temp[1]);
        gouraud_vert.push(temp[2]);
    }

}
function addPickObject(){
    var translationMatrix= [];
    var rotationMatrix = [];
    
    var total_x = 0;
    var total_y = 0;
    var total_z = 0;
    var avg = 0;
    var center_obj = [];
    var div = translated_vert.length / 3;
    for(var i = 0; i < translated_vert.length; i+=3){
        total_x += translated_vert[i];
        total_y += translated_vert[i+1];
        total_z+= translated_vert[i+2];
    }
    center_obj.push(total_x/div);
    center_obj.push(total_y/div);
    center_obj.push(total_z/div);
    
    
    for(var i = 0; i < translated_vert.length; i +=3){
        translated_vert[i] = translated_vert[i] - center_obj[0];
        translated_vert[i+1] = translated_vert[i+1] - center_obj[1];
        translated_vert[i+2] = translated_vert[i+2] - center_obj[2];
    }
    
    
    verticies_array.push(translated_vert);
    objectList.push(coordinates);
    translationMatrix = new Matrix4();
    rotationMatrix = new Matrix4();
    translationMatrix.setTranslate(center_obj[0], center_obj[1], center_obj[2]);
    rotationMatrix.setIdentity();
        
    translated_matricies.push(translationMatrix);
    rotated_matricies.push(rotationMatrix);

}

function countVectors(vector_count){
    var countVec = [];

    for(var i = 0; i < vector_count[0].length; i++){
        countVec.push(0);
    }
    for(var j = 0; j < vector_count.length; j+=1){
        countVec = vector_addition(vector_count[j], countVec);
    }

    countVec = vector_by_scalar(countVec, 1/vector_count.length);
    return countVec;
}

function vector_addition(v1, v2){
    var sum = [];
    for (var i = 0; i < v1.length; i++){
        sum.push(v1[i] + v2[i]);
    }
    return sum;
}

function specular_light(specular_coef, normals){
    var vector_half;
    var light = direction_color_point;
    var ks = specular_lightt;
    var viewer = [0, 0, 1];
    var N = [];
    var specular_angle = [];

    specular_shading = [];

    for(var i = 0; i < normals.length; i+=3){
        var n_normal = ([normals[i], normals[i+1], normals[i+2]]);
        N.push(normalize_vector(n_normal));
    }

    var vector_sum = vector_addition(light, viewer);
    vector_half = normalize_vector(vector_sum);

    for(var i = 0; i < N.length; i++){
        specular_angle.push(vector_dot_product(N[i], vector_half));
    }

    for(var j = 0; j < specular_angle.length; j++){
        specular_shading.push(ks[0] * Math.pow(specular_angle[j], specular_coef));
        specular_shading.push(ks[1] * Math.pow(specular_angle[j], specular_coef));
        specular_shading.push(ks[2] * Math.pow(specular_angle[j], specular_coef));
    }

}

function calc_lighting_1(i){
    var center_cylinder_vertexx = g_points[i-4];
    var center_cylinder_vertexy = g_points[i-3];
    var center_cylinder_vertex2x = g_points[i-2];
    var center_cylinder_vertex2y = g_points[i-1];
    var m = (center_cylinder_vertex2y - center_cylinder_vertexy) / (center_cylinder_vertex2x - center_cylinder_vertexx);
    var nonroatatedPoints = Math.atan(m);
    
    if(center_cylinder_vertex2x-center_cylinder_vertexx < 0){
        nonroatatedPoints += Math.PI;
    }
    return nonroatatedPoints;                                    
}

function calc_lighting_2(i){
    var theta1;
    var theta_;

    var center_cylinder_vertex3x = g_points[i-2];    
    var center_cylinder_vertex3y = g_points[i-1];
    var center_cylinder_vertex2x = g_points[i-4];
    var center_cylinder_vertex2y = g_points[i-3];
    var center_cylinder_vertexx = g_points[i - 6];
    var center_cylinder_vertexy = g_points[i - 5];

    var m1 = (center_cylinder_vertex2y - center_cylinder_vertexy) / (center_cylinder_vertex2x - center_cylinder_vertexx);
    var m2 = (center_cylinder_vertex3y - center_cylinder_vertex2y) / (center_cylinder_vertex3x - center_cylinder_vertex2x); //slope
    theta1 = Math.atan(m1);
    theta_ = Math.atan(m2); 
    
    if(center_cylinder_vertex2x-center_cylinder_vertexx < 0){
        theta1 += Math.PI;
    }
    
    if(center_cylinder_vertex3x - center_cylinder_vertex2x < 0){
        theta_ += Math.PI;
    }
    
    roatatedPoints = (theta1 + theta_) / 2;
    return roatatedPoints;
}


function find_perpendicular_vertex(scalar_coeff, lighting_coeff, vertex_x_center, vertex_y_center, center_cylinder_vertex){
    var rotated = []; 
    var x;
    var y;
    var z;
    for(var j = 0; j < center_cylinder_vertex.length; j+=3){
       x = scalar_coeff * ((center_cylinder_vertex[j] 
        * Math.cos(lighting_coeff)) - (center_cylinder_vertex[j+1] 
        * Math.sin(lighting_coeff)));

       y = scalar_coeff * ((center_cylinder_vertex[j] 
        * Math.sin(lighting_coeff)) + (center_cylinder_vertex[j+1] 
        * Math.cos(lighting_coeff)));

       z = (center_cylinder_vertex[j+2]);
       rotated.push(x);
       rotated.push(y);
       rotated.push(z);
    }
    
    for(var i = 0; i < center_cylinder_vertex.length; i+=3){
        translated_vert.push(rotated[i] + vertex_x_center);
        translated_vert.push(rotated[i+1] + vertex_y_center);
        translated_vert.push(rotated[i+2]);
      }
    
}

function rotateCylinder(){
    translated_vert = [];

    var center_cylinder_vertex = [];    
    var radius = 50;
    var L;
    var x = 0;     
    var y = 0;
    var z = 0;
    var scaleArr = [];
    var approximateThetas = [];
    var approximateThetas2 = [];
    var theta_ = [];

    approximateThetas.push(calc_lighting_1(4));
    for(var i = 6; i <= count; i+=2){
        approximateThetas.push(calc_lighting_2(i));
    }
    approximateThetas.push(calc_lighting_1(count)); 

    for(var i = 4; i <= count; i+=2){
        theta_.push(calc_lighting_1(i));
    }
    theta_.push(calc_lighting_1(count));
    
    for(var theta =  2* (Math.PI); theta > 0; 
        theta-= 2 *(Math.PI * (1.0/POLYGON_SIDES)))
    {
        z = radius * Math.cos(theta);
        y = radius * Math.sin(theta);

        center_cylinder_vertex.push(x);
        center_cylinder_vertex.push(y);
        center_cylinder_vertex.push(z);
    }

    for(var i = 0; i < approximateThetas.length; i++){
       L = 1/(Math.cos(approximateThetas[i] - theta_[i]));
       scaleArr.push(L);
    }

    approximateThetas2.push(calc_lighting_1(4));
    for(var i = 6; i <= count; i+=2){
        approximateThetas2.push(calc_lighting_2(i));
    }
    approximateThetas2.push(calc_lighting_1(count));
        
    
    for(var i = 0; i < count / 2; i++){
        find_perpendicular_vertex(scaleArr[i], approximateThetas2[i], 
            g_points[i * 2], g_points[(i*2) + 1], center_cylinder_vertex);
    }    
}

function rotateVectors(newly_rotated_vecs, vec_length, convert_vec){
    var rotatedVec = [];

    for(var i = 0; i < newly_rotated_vecs.length; i+=vec_length){
        var oneVector = [];
        for(var j = 0; j < vec_length; j++){
            oneVector.push(newly_rotated_vecs[j+i]);
        }
        var transformedVector = convert_vec(oneVector);
        for(var k = 0; k < transformedVector.length; k++){
            rotatedVec.push(transformedVector[k]); 
        }
    }
    //console.log("rotatedVec: " + rotatedVec);
    return rotatedVec; 
}

function color_cylinder(normals){
    //find the color by finding the scalar by normal
    console.log("In Color_cylinder");
    colorShade = [];

    colorShade = rotateVectors(normals, 3, function(vector){
        var vector_dot_productt = vector_dot_product(vector, normalized_light);
 
        if(vector_dot_productt < 0){
            vector_dot_productt = 0;
        }
        return vector_by_scalar(color, vector_dot_productt);
    });
}

function color_cylinder_point(normals, direction_of_light){
    shaded_point_light = [];
    var multipliedByScalar = [];

    for(var i = 0; i < normals.length; i+=3){
        var vector_dot_product = 0;
        vector_dot_product += normals[i] * direction_of_light[i];
        vector_dot_product += normals[i+1] * direction_of_light[i+1];
        vector_dot_product += normals[i+2] * direction_of_light[i+2];
        if(vector_dot_product < 0){
            vector_dot_product = 0;
        }
        multipliedByScalar = vector_by_scalar(color, vector_dot_product);
        shaded_point_light.push(multipliedByScalar[0]);
        shaded_point_light.push(multipliedByScalar[1]);
        shaded_point_light.push(multipliedByScalar[2]);
    }
}

//index array with x, y, z coordinates stored as 24 indeces
function xyz_coordinate_count(){
    var numCylinders = (count / 2) - 1;
    
    coordinates = [];    
    
    for(var j = 0; j < numCylinders; j++){
        for(var i = 0; i < POLYGON_SIDES; i++){
            coordinates.push(((i) % POLYGON_SIDES) + POLYGON_SIDES * j);
            coordinates.push((i+1) % POLYGON_SIDES + POLYGON_SIDES * j);
            coordinates.push((((i+1) % POLYGON_SIDES) + POLYGON_SIDES * (j + 1)));

            coordinates.push((((i+1) % POLYGON_SIDES) + POLYGON_SIDES * (j + 1)));
            coordinates.push((((i) % POLYGON_SIDES) + POLYGON_SIDES * (j + 1)));
            coordinates.push(((i) % POLYGON_SIDES) + POLYGON_SIDES * j);
        }
    }
    
    return coordinates;
}

function center_normal_helper(normalized_vertices, normalFirst, normalLast){
    for(var i = 0; i < norms_array_vec.length; i += 3){
        normalLast.push(normalFirst[i] + norms_array_vec[i] * 15);
        normalLast.push(normalFirst[i+1] + norms_array_vec[(i+1)] * 15);
        normalLast.push(normalFirst[i+2] + norms_array_vec[(i+2)] * 15);
    }
    for(var i = 0; i < norms_array_vec.length; i +=6){
        normalized_vertices.push(normalFirst[i]);
        normalized_vertices.push(normalFirst[i+1]);
        normalized_vertices.push(normalFirst[i+2]);
        normalized_vertices.push(normalLast[i]);
        normalized_vertices.push(normalLast[i+1]);
        normalized_vertices.push(normalLast[i+2]);
    }
}
//normals from the center 
function find_normal_vec() {
    normalized_vertices = [];
    var normalFirst = [];
    var normalLast = [];
    normalFirst = find_center_points_normal();
    center_normal_helper(normalized_vertices, normalFirst, normalLast);
}

function  find_center_points_normal_helper(centers, Xpoint, Ypoint, Zpoint){
    centers.push((translated_vert[(Xpoint) * 3] + 
        translated_vert[(Ypoint) * 3] + translated_vert[(Zpoint) * 3]) / 3);
    centers.push((translated_vert[((Xpoint) * 3) + 1] + 
        translated_vert[((Ypoint) * 3) + 1] + translated_vert[((Zpoint) * 3) + 1])/3);
    centers.push((translated_vert[((Xpoint) *3) + 2] + 
        translated_vert[((Ypoint) *3) + 2] + translated_vert[((Zpoint) *3) + 2])/3 ); 
}
function find_center_points_normal(){
    centers = [];
    lighting_on_surface = [];
    for(var i = 0; i < coordinates.length; i+=3){
        var Xpoint = coordinates[i];
        var Ypoint = coordinates[i+1];
        var Zpoint = coordinates[i+2];
        find_center_points_normal_helper(centers, Xpoint, Ypoint, Zpoint);
  
    }
    for(var j = 0; j < centers.length; j++){
        lighting_on_surface.push(direction_color_point[j] - centers[j]);
    }
    console.log("normal-center: " + centers);
    return centers;
}



function help_cylinder_normals(c1, v1, z1, Xpoint, Ypoint, Zpoint){
    c1.push(translated_vert[(Xpoint) * 3]);
    c1.push(translated_vert[((Xpoint) * 3) + 1]);
    c1.push(translated_vert[((Xpoint) *3) + 2]);
    v1.push(translated_vert[(Ypoint) * 3]);
    v1.push(translated_vert[((Ypoint) * 3) + 1]);
    v1.push(translated_vert[((Ypoint) *3) + 2]);
    z1.push(translated_vert[(Zpoint) * 3]);
    z1.push(translated_vert[((Zpoint) * 3) + 1]);
    z1.push(translated_vert[((Zpoint) *3) + 2]); 
}

function cylinder_normals(){
    console.log("In cylinder_normals  ");
    var cross = [];
    norms_array_vec = [];
    var c1 = [];
    var v1 = [];
    var z1 = [];
    var c1v1 = [];
    var v1z1 = [];

    for(var i = 0; i < coordinates.length; i +=3){

        var Xpoint = coordinates[i];
        var Ypoint = coordinates[i+1];
        var Zpoint = coordinates[i+2];
        help_cylinder_normals(c1, v1, z1, Xpoint, Ypoint, Zpoint);  
    }
    for(var j = 0; j < c1.length; j++){
        c1v1.push(v1[j] - c1[j]);
    }
    for(var k = 0; k < v1.length; k++){
        v1z1.push(z1[k] - v1[k]);
    }
    
    //cross product
    for(var i = 0; i < c1v1.length; i+=3){
    cross.push((c1v1[i+1] * v1z1[i+2]) - (v1z1[i+1] * c1v1[i+2]));
    cross.push((v1z1[i] * c1v1[i+2]) - (c1v1[i] * v1z1[i+2]));
    cross.push((c1v1[i] * v1z1[i+1]) - (v1z1[i] * c1v1[i+1]));
    }
 
    //normalize
    for(var i = 0; i < cross.length; i+=3){
        var length = Math.sqrt(Math.pow(cross[i], 2) + Math.pow(cross[i+1], 2) +
                                Math.pow(cross[i+2], 2));
        norms_array_vec.push(cross[i]/length);
        norms_array_vec.push(cross[i+1]/length);
        norms_array_vec.push(cross[i+2]/length);
    }      
}

function normalized_vertices_surface(){
    normalized_vertices_surfaceArray = [];
    for(var i = 0; i < coordinates.length; i++){
        var Xpoint = coordinates[i];
        normalized_vertices_surface_helper(normalized_vertices_surfaceArray, Xpoint);

    }
}


function calculateColors(colorPhase, color){
    var calculatedColor = [];
    
    for(var i = 0; i < colorPhase.length; i+=3){
        calculatedColor.push(colorPhase[i]);
        calculatedColor.push(colorPhase[i+1]);
        calculatedColor.push(colorPhase[i+2]);
        calculatedColor.push(color);
    }
    return calculatedColor;
}

function drawPolyline1(){        
    var n = count/2; // # of coordinates
    
    
    //Create buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer){
        console.log('Failed to create the buffer object');
        return false;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, g_points, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    gl.drawArrays(gl.LINE_STRIP, 0, count/2 + 1);
    return true;    
}

function createBufferCylinder(gl){
     //Create buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer){
        console.log('Failed to create the buffer object');
        return false;
    }
    return vertexBuffer;
}

function colorBuffer(newcolorPhase){
    var shadedColorsArray = new Float32Array(newcolorPhase);
    var colorBuffer = gl.createBuffer();
        
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, shadedColorsArray, gl.STATIC_DRAW);

}

function changeObjectColor(object, color){
    if(picked != object){
        for(var i = 0; i < color.length; i+=3){
            color[i] = color[i] + 0;
            color[i+1] = color[i+1] + 0;
            color[i+2] = color[i+2] + .8;
        }
    }else{
        for(var i = 0; i < color.length; i+=3){
            color[i] = color[i] + .10;
            color[i+1] = color[i+1] + .10;
            color[i+2] = color[i+2] + .10;
        }
    }
}

//draw the flat-colored cylinder
function setup_cylinder(object, alpha){

        var color;
        var normals;
        var specular_lighting = [];
        var transforM = new Matrix4();
        transforM.setIdentity();
        translated_vert = [];        
        
        transforM.multiply(translated_matricies[object]);

        coordinates = (objectList[object]);
        un_transformed_vertex = objectList[object];


        for(var i = 0; i < un_transformed_vertex.length; i +=3){
            var oneVector = new Vector4([un_transformed_vertex[i], un_transformed_vertex[i+1], un_transformed_vertex[i+2], 1]);
            oneVector = transforM.multiplyVector4(oneVector);
            translated_vert.push(oneVector.elements[0]);
            translated_vert.push(oneVector.elements[1]);
            translated_vert.push(oneVector.elements[2]);
        }

    
        //xyz_coordinate_count();
        rotateCylinder(); 
        cylinder_normals();

        normalized_light = normalize_vector(direction_color_point);
        normalized_vertices_surface();
        calc_normals_vertex();
        color_cylinder(norms_array_vec);
        flat_shaded_vertices = [];
        for(var i = 0; i < colorShade.length; i+=3){

            flat_shaded_vertices.push(colorShade[i]);
            flat_shaded_vertices.push(colorShade[i+1]);
            flat_shaded_vertices.push(colorShade[i + 2]);
            flat_shaded_vertices.push(colorShade[i]);
            flat_shaded_vertices.push(colorShade[i+1]);
            flat_shaded_vertices.push(colorShade[i + 2]);
            flat_shaded_vertices.push(colorShade[i]);
            flat_shaded_vertices.push(colorShade[i+1]);
            flat_shaded_vertices.push(colorShade[i + 2]);
    }

        normals = normalized_vec_array;
        color = flat_shaded_vertices;

        changeObjectColor(object, color);
          

        //gouraud begins here
        // gouraud_shaded_norms();
        // normals = normalized_gouraud_vec_array;
        // color_cylinder(normalized_gouraud_vec_array);

        // gouraud_shaded_vertices = [];
        // for(var i = 0; i < colorShade.length; i+=3){
        //     gouraud_shaded_vertices.push(colorShade[i]);
        //     gouraud_shaded_vertices.push(colorShade[i+1]);
        //     gouraud_shaded_vertices.push(colorShade[i+2]);
        // }
        // color = gouraud_shaded_vertices;
       
        var arr = new Float32Array(normalized_vertices_surfaceArray);
        var newcolorPhase = calculateColors(color, alpha);

        var vertexBuffer = createBufferCylinder(gl);


        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);


        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        
        colorBuffer(newcolorPhase);
        
        gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Color);
        
        gl.drawArrays(gl.TRIANGLES, 0, arr.length / 3);
        return true;    
}
//draw the normals when clicked 
function drawSurfaceNormals(){
          
        xyz_coordinate_count();
        rotateCylinder(); 
        cylinder_normals();
        find_normal_vec();

        normal_point_color = [];
            for (var i = 0; i < normalized_vertices.length; i+=3) {
            normal_point_color.push(normal_color[0]);
            normal_point_color.push(normal_color[1]);
            normal_point_color.push(normal_color[2]);
        }

        var normalArr = new Float32Array(normalized_vertices);

        //Create buffer object
        var normal_buff = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, normal_buff);
        gl.bufferData(gl.ARRAY_BUFFER, normalArr, gl.STATIC_DRAW);

        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        var newnormalized_verticesColor = calculateColors(normal_point_color, 1.0);
        var normalColorArray = new Float32Array(newnormalized_verticesColor);
        
        // define the color of normals
        var color_buff = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, color_buff);
        gl.bufferData(gl.ARRAY_BUFFER, normalColorArray, gl.STATIC_DRAW);

        gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Color);

        gl.drawArrays(gl.LINES , 0, normalized_vertices.length/3);
    
        return true;   
}






