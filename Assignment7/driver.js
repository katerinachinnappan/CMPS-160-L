//global variables
var FSIZE = (new Float32Array()).BYTES_PER_ELEMENT; // size of a vertex coordinate (32-bit float)
var VSHADER_SOURCE = null; // vertex shader program
var FSHADER_SOURCE = null; // fragment shader program
var POLYGON_SIDES = 12;

var g_points = new Float32Array(200); 
var n = 0; 
var XPoint = [];   
var right_mouseClick = false; 
var index=0;
var gl;
var canvas;
var a_Position;
var a_Color;
var norms_array_vec = [];
var normal_point_color = [];
var center_cylinder_vertex = [];
var lighting_on_surface = [];
var normalized_light = [];
var colorShade = [];
var vertices = [];  
var coordinates = [];  
var norm = []; 
var normal_color = [1, 0, 0];
var direction_color_point = [1.0, 1.0, 1.0];
var color = [1, 0, 0];
var lineColor = [0, 0, 0];
var roatatedPoints;
var normalized_vec_array = [];
var normal_each_vertex = [];
var flat_shading_color = [];
var polylineColor = [];
var objectList = []; 
var translated_vert = []; 
var picked = null; 
var alpha = .50;
var scaling = false;
var translated_matrix_list = [];
var rotated_matrix_list= [];
var scaled_matrix_list = [];
var rotate = false;
var translate = false;
var rotation_matrix= new Matrix4();
rotation_matrix.setIdentity();
var translation_matrix =  new Matrix4();
translation_matrix.setIdentity();
var scaling_matrix = new Matrix4();
scaling_matrix.setIdentity();
var scale_by_amount = 0;
var move_x;
var move_y;
var orthoL = -500.0;
var orthoR = 500.0;
var orthoB = -500.0;
var orthoT = 500.0;
var look_atX = 0;
var look_atY = 0;
var look_atZ = 0;
var look_fromX = 0;
var look_fromY = 0;
var look_fromZ = 1000;
var panX;
var panY;
var pan_xx = 0;
var pan_yy = 0;
var projMatrix;
var u_ProjMatrix;
var view;
var u_ViewMatrix;
var pan = false;

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
    canvas.onmousewheel = function(ev){scaleCylinder(ev)};
    canvas.onmouseup = function(ev){stop_movement(ev)};

    canvas.addEventListener('mousemove',function(ev){mouse_direction(ev)});
    document.getElementById('update_screen').onclick = function(){ updateScreen(canvas, gl); };
    document.getElementById('save_canvas').onclick = function(){ saveCanvas(); };
    document.getElementById('reset_canvas').onclick = function(){ resetCanvas(canvas, gl); };
     
    
    
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    
    gl.enable(gl.DEPTH_TEST);
    
}


function click_helper(x, y, g_points){
    g_points[index]=x;
    index++;
    g_points[index]=y;
    index++; 
    index-=2;
}
function click(ev){
    var x = ev.clientX; //x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
    
    if(right_mouseClick){
        if(picked != null){
           console.log('in clicked: picked != null');
            scaled_matrix_list[picked] = scaled_matrix_list[picked].multiply(scaling_matrix);
            scaling_matrix.setIdentity();
            scale_by_amount = 0;
            scaling = false;
        }
        if(rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom){
            var x_in_canvas = x - rect.left, y_in_canvas = rect.bottom - y;
            var pixels = new Uint8Array(4);
            gl.readPixels(x_in_canvas, y_in_canvas, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            if(pixels[3] != 255){
              for(var i = 0; i < objectList.length; i++){
              var comparison = Math.round((255 * (.97 - (i*.01))));
              if(comparison == pixels[3]){
                picked = i;
            }
          }
        }
        else{
         picked = null;      
        }
        console.log('pixel_color: ' + pixels);
      }   
        if(ev.button == 0 && picked != null){
            console.log('in translate mode');
            translate = true;
            move_x = x;
            move_y = y;
        }
        if(ev.button == 2 && picked != null){
            console.log('in rotate mode');
            rotate = true;
            move_x = x;
            move_y = y;
        }
        if(ev.button == 0 && picked == null){
            console.log('pan scene')
            pan  = true;
            panX = x;
            panY = y;
        }
        drawScene();
        return;  
    }
    
    
    if(ev.button==0 && right_mouseClick == false){        
      x = (((x - rect.left) - canvas.width/2)/(canvas.width/2)) * 500;
      y = ((canvas.height/2 - (y - rect.top))/(canvas.height/2)) * 500; 
        
      g_points[index]=x;
      index++;
      g_points[index]=y;
      index++;
      click_helper(x, y, g_points);
    }
    
    if(ev.button==2 && right_mouseClick == false){
        
        xyz_coordinate_count();
        transform_cylinder();
        
        addPickObject();
        right_mouseClick = true;
        
    }

   drawScene();
}

function addPickObject(){
    var rotationMatrix = [];
    var translationMatrix= [];
    var scalingMatrix = [];  
    var x = 0;
    var y = 0;
    var z = 0;
    var avg = 0;
    var picked_obj = [];
    var div = vertices.length / 3;
    for(var i = 0; i < vertices.length; i+=3){
        x += vertices[i];
        y += vertices[i+1];
        z+= vertices[i+2];
    }
    picked_obj.push(x/div);
    picked_obj.push(y/div);
    picked_obj.push(z/div);
    
    
    for(var i = 0; i < vertices.length; i +=3){
        vertices[i] = vertices[i] - picked_obj[0];
        vertices[i+1] = vertices[i+1] - picked_obj[1];
        vertices[i+2] = vertices[i+2] - picked_obj[2];
    }
    
    
    translated_vert.push(vertices);
    objectList.push(coordinates);
    translationMatrix = new Matrix4();
    rotationMatrix = new Matrix4();
    scalingMatrix = new Matrix4();
    translationMatrix.setTranslate(picked_obj[0], picked_obj[1], picked_obj[2]);
    rotationMatrix.setIdentity();
    scalingMatrix.setIdentity();    
    translated_matrix_list.push(translationMatrix);
    rotated_matrix_list.push(rotationMatrix);
    scaled_matrix_list.push(scalingMatrix);
}


function scaleCylinder(ev){
  console.log('in scaling mode');
    ev.preventDefault();
    if(right_mouseClick){
        if(picked != null){
            scale_by_amount += ev.deltaY * .009;
            if(scale_by_amount < -1)    scale_by_amount = -1;
            if(scale_by_amount > 1)     scale_by_amount = 1;
            var actualScale = Math.pow(2, scale_by_amount);
            scaling_matrix.setScale(actualScale, actualScale, actualScale);
            console.log('scale_amount: '+ scale_by_amount);
            drawScene();
        }else if(picked == null){
            orthoL -= ev.deltaY * .5;
            orthoR += ev.deltaY * .5;
            orthoB -= ev.deltaY * .5;
            orthoT += ev.deltaY * .5;
            if(orthoT < 12.5){
                orthoT = 12.5;
                orthoR = 12.5;
            }
            if(orthoB > -12.5){
                orthoB = -12.5;
                orthoL = -12.5;
            }
            drawScene();
        }
    }
}

function mouse_direction(ev){
   
    var x = ev.clientX; //x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
    
     if(right_mouseClick) {

        if(picked != null &&  translate == true){
            translation_matrix.setTranslate((x - move_x), -(y - move_y), 0);
            drawScene();
        }
        if(picked != null && rotate == true){
            if(Math.abs((x-move_x)) > Math.abs((y-move_y))){
                rotation_matrix.setRotate(x-move_x, 0, 0, 1);
                drawScene();
            }
            if(Math.abs((x - move_x)) < Math.abs((y-move_y))){
                rotation_matrix.setRotate(-(y-move_y), 1, 0, 0);
                drawScene();
            } 
        }
        if(picked != null && scaling == true){
            scaled_matrix_list[picked] = scaled_matrix_list[picked].multiply(scaling_matrix);
            scaling_matrix.setIdentity();
            scale_by_amount = 0;
            scaling = false;
            drawScene(); 
        }
        if(picked == null && pan == true){
            pan_xx = x - panX;
            pan_yy = -(y - panY);
            if(pan_xx > 300) pan_xx = 300;
            if(pan_xx < -300) pan_xx = -300;
            if(pan_yy > 300) pan_yy = 300;
            if(pan_yy < -300) pan_yy = -300;
            console.log('pan_xx: '+ pan_xx);
            console.log('pan_yy: '+ pan_yy);
            drawScene();
        }
        return; 
    }
        
    // Convert coordinates to canvas plane
    x = (((x-rect.left)-canvas.width/2)/(canvas.width/2)) * 500;
    y = ((canvas.height/2-(y-rect.top))/(canvas.height/2)) * 500;
    

    click_helper(x, y, g_points);
    
    
    drawScene();
}
    
function stop_movement(ev){
    
    if(!right_mouseClick) return;
    if(picked != null){
        rotated_matrix_list[picked] = rotated_matrix_list[picked].multiply(rotation_matrix);
        translated_matrix_list[picked] = translated_matrix_list[picked].multiply(translation_matrix);
        scaled_matrix_list[picked] = scaled_matrix_list[picked].multiply(scaling_matrix);
    }
    
    if(picked == null){
        look_atX += pan_xx;
        look_atY += pan_yy;
        look_fromX += pan_xx;
        look_fromY += pan_yy;
    }
   stop_movement_helper();  
}

function stop_movement_helper(){
    translate = false;
    rotate = false;
    scaling = false;
    pan = false;
    translation_matrix.setIdentity();
    rotation_matrix.setIdentity();
    scaling_matrix.setIdentity();
    scale_by_amount = 0;
    pan_xx = 0;
    pan_yy = 0;
    drawScene();
}

function ortho(){
    u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
        
    projMatrix = new Matrix4();
    
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
        
    viewMatrix = new Matrix4();

    projMatrix.setOrtho(orthoL, orthoR, orthoB, orthoT, 1, 1800);
    viewMatrix.setIdentity();
    viewMatrix.lookAt(look_fromX + pan_xx, look_fromY + pan_yy, look_fromZ, look_atX + pan_xx, look_atY + pan_yy, look_atZ, 0, 1, 0);
    console.log("viewMatrix: " + viewMatrix);

    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);


}
function drawScene(){
    ortho();

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    alpha = .97;
    drawPolyline1();
    if(right_mouseClick == true){
        for(var i = 0; i < objectList.length; i++){
                setup_cylinder(i, alpha);
                alpha -= .01;
            }
        }
}


function normalize(vector){
    var normal_vector = [];
    var length = vector_magnitude(vector);
    for(var i = 0; i < vector.length; i++){
        normal_vector.push(vector[i]/length);
    }
    return normal_vector;
}

function dotProduct(vector1, vector2){
    var dot_product = 0;
    for(var i = 0; i < vector1.length; i++){
        dot_product += vector1[i] * vector2[i];
    }
    return dot_product;
}

function vector_magnitude(vector){
    var sum = 0;
    for (var i = 0; i < vector.length; i++){
        sum += Math.pow(vector[i], 2);
    }
    return Math.sqrt(sum);
}

function crossProduct(vector1, vector2){
    var cross_product = [];
    cross_product.push((vector1[1] * vector2[2]) - (vector2[1] * vector1[2]));
    cross_product.push((vector2[0] * vector1[2]) - (vector1[0] * vector2[2]));
    cross_product.push((vector1[0] * vector2[1]) - (vector2[0] * vector1[1]));
    return cross_product;
}


function scaleVector(vector, scalar){
    var scaledVector = [];
    for(var i = 0; i < vector.length; i++){
        scaledVector.push(scalar * vector[i]);
    }
    return scaledVector;
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
    return rotatedVec; 
}

function vector_addition(vector1, vector2){
    var sum = [];
    for(var i = 0; i < vector1.length; i++){
        sum.push(vector1[i] + vector2[i]);
    }
    return sum;
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

function vector_average_sum(vector_list){
    var vectors_total = [];
    var size = vector_list[0].length;
    for(var j = 0; j < size; j++){
        vectors_total.push(0);
    }
    for(var i = 0; i < vector_list.length; i+=1){
        vectors_total = vector_addition(vector_list[i], vectors_total);
    }
    var div = vector_list.length;
    vectors_total = scaleVector(vectors_total, 1/div);
    return vectors_total;
}


function rotatedPoints(){
    var rotated_points = [];
    rotated_points.push(calc_lighting_1(4));
    for(var i = 6; i <= index; i+=2){
        rotated_points.push(calc_lighting_2(i));
    }
     rotated_points.push(calc_lighting_1(index)); 
    return rotated_points;
}

function find_theta(){
    var theta2s = [];
    for(var i = 4; i <= index; i+=2){
        theta2s.push(calc_lighting_1(i));
    }
    theta2s.push(calc_lighting_1(index));
    return theta2s;
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


function transform_cylinder(){
    vertices = [];
    
    var XPoint = count_cylinders();
    var arr = [];
    var theta1 = rotatedPoints();
    var L;
    var theta2 = find_theta();
    for(var i = 0; i < theta1.length; i++){
       L = 1/(Math.cos(theta1[i] - theta2[i]));
       arr.push(L);
    }
    
    var theta = rotatedPoints();
    
    for(var i = 0; i < index / 2; i++){
        find_perpendicular_vertex(arr[i], theta[i], g_points[i * 2], g_points[(i*2) + 1], XPoint);
    }    
}

function rotateCylinder(XPoint){
    var P = [];
    var Q = [];
    var R = [];
    var PQ = [];
    var QR = [];
    for(var i = 0; i < coordinates.length; i +=3){
        var Pindex = coordinates[i];
        var Qindex = coordinates[i+1];
        var Rindex = coordinates[i+2];
        P.push(vertices[(Pindex) * 3]);
        P.push(vertices[((Pindex) * 3) + 1]);
        P.push(vertices[((Pindex) *3) + 2]);
        Q.push(vertices[(Qindex) * 3]);
        Q.push(vertices[((Qindex) * 3) + 1]);
        Q.push(vertices[((Qindex) *3) + 2]);
        R.push(vertices[(Rindex) * 3]);
        R.push(vertices[((Rindex) * 3) + 1]);
        R.push(vertices[((Rindex) *3) + 2]);   
    }
    for(var j = 0; j < P.length; j++){
        PQ.push(Q[j] - P[j]);
    }
    for(var k = 0; k < Q.length; k++){
        QR.push(R[k] - Q[k]);
    }

    var cross = [];
    for(var i = 0; i < PQ.length; i+=3){
    cross.push((PQ[i+1] * QR[i+2]) - (QR[i+1] * PQ[i+2]));
    cross.push((QR[i] * PQ[i+2]) - (PQ[i] * QR[i+2]));
    cross.push((PQ[i] * QR[i+1]) - (QR[i] * PQ[i+1]));
    }
    norm = [];
    for(var i = 0; i < cross.length; i+=3){
        var length = Math.sqrt(Math.pow(cross[i], 2) + Math.pow(cross[i+1], 2) +
                                Math.pow(cross[i+2], 2));
        norm.push(cross[i]/length);
        norm.push(cross[i+1]/length);
        norm.push(cross[i+2]/length);
    }      
}

function xyz_coordinate_count(){
    var cylinders = (index / 2) - 1;
    
    coordinates = [];    
    
    for(var j = 0; j < cylinders; j++){
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

function find_perpendicular_vertex(LScale, thetaa, vertex_x_center, vertex_y_center, XPoint){
    var rotated = [];
    var x;
    var y;
    var z;
    for(var j = 0; j < XPoint.length; j+=3){
       x = LScale * ((XPoint[j] * Math.cos(thetaa)) - (XPoint[j+1] * Math.sin(thetaa)));
       y = LScale * ((XPoint[j] * Math.sin(thetaa)) + (XPoint[j+1] * Math.cos(thetaa)));
       z = (XPoint[j+2]);
       rotated.push(x);
       rotated.push(y);
       rotated.push(z);
    }
    
    for(var i = 0; i < XPoint.length; i+=3){
        vertices.push(rotated[i] + vertex_x_center);
        vertices.push(rotated[i+1] + vertex_y_center);
        vertices.push(rotated[i+2]);
      }

    
}

function calculateColors(color, alpha){
    var calculatedColor = [];
    
    for(var i = 0; i < color.length; i+=3){
        calculatedColor.push(color[i]);
        calculatedColor.push(color[i+1]);
        calculatedColor.push(color[i+2]);
        calculatedColor.push(alpha);
    }
    return calculatedColor;
}

function color_cylinder(normals){
    colorShade = [];
    colorShade = rotateVectors(normals, 3, function(vector){
        var dot_product = dotProduct(vector, normalized_light);
        if(dot_product < 0){
            dot_product = 0;
        }
        return scaleVector(color, dot_product);
    });
}


function drawPolyline1(){
  if(right_mouseClick != true){
    polylineColor = [];
    for(var i = 0; i < g_points.length; i+=3){
        polylineColor.push(lineColor[0]);
        polylineColor.push(lineColor[1]);
        polylineColor.push(lineColor[2]);
    }
    var n = index/2;
    
    
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer){
        console.log('Failed to create the buffer object');
        return false;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, g_points, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    var new_color = calculateColors(polylineColor, 1.0);
    var clicked_color = new Float32Array(new_color);
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, clicked_color, gl.STATIC_DRAW);
        
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Color);
    
    gl.drawArrays(gl.LINE_STRIP, 0, index/2 + 1);
  }
    return true;
}

function setup_cylinder(anObjectIndex, alpha){

        console.log('setting up cylinder');

        var color;
        var normals;
        var transforM= new Matrix4();
        transforM.setIdentity();
        var addSpec = [];
        vertices = [];        
        
        transforM.multiply(translated_matrix_list[anObjectIndex]);
    
        if(picked == anObjectIndex){
            transforM.multiply(translation_matrix);
        }
         
        transforM.multiply(rotated_matrix_list[anObjectIndex]);
    
        if(picked == anObjectIndex){
            transforM.multiply(rotation_matrix);
        }
    
        transforM.multiply(scaled_matrix_list[anObjectIndex]);
        if(picked == anObjectIndex){
            transforM.multiply(scaling_matrix);
        }
        
        coordinates = (objectList[anObjectIndex]);
        un_transformed_vertex = translated_vert[anObjectIndex];

    
    
        for(var i = 0; i < un_transformed_vertex.length; i +=3){
            var oneVector = new Vector4([un_transformed_vertex[i], un_transformed_vertex[i+1], un_transformed_vertex[i+2], 1]);
            oneVector = transforM.multiplyVector4(oneVector);
            vertices.push(oneVector.elements[0]);
            vertices.push(oneVector.elements[1]);
            vertices.push(oneVector.elements[2]);
        }
    
        rotateCylinder();
        normalized_light = normalize(direction_color_point);
        normalized_vertices_surfaceArray = [];
        for(var i = 0; i < coordinates.length; i++){
          var Pindex = coordinates[i];
          normalized_vertices_surfaceArray.push(vertices[Pindex * 3]);
          normalized_vertices_surfaceArray.push(vertices[(Pindex * 3) + 1]);
          normalized_vertices_surfaceArray.push(vertices[(Pindex * 3) + 2]);
      }

        color_cylinder(norm);
        normal_each_vertex = [];
        for(var i = 0; i < norm.length; i+=3){
          normal_each_vertex.push(norm[i]);
          normal_each_vertex.push(norm[i + 1]);
          normal_each_vertex.push(norm[i + 2]);
          normal_each_vertex.push(norm[i]);
          normal_each_vertex.push(norm[i + 1]);
          normal_each_vertex.push(norm[i + 2]);
          normal_each_vertex.push(norm[i]);
          normal_each_vertex.push(norm[i + 1]);
          normal_each_vertex.push(norm[i + 2]);
      }
        flat_shading_color = [];
        for(var i = 0; i < colorShade.length; i+=3){
          flat_shading_color.push(colorShade[i]);
          flat_shading_color.push(colorShade[i+1]);
          flat_shading_color.push(colorShade[i + 2]);
          flat_shading_color.push(colorShade[i]);
          flat_shading_color.push(colorShade[i+1]);
          flat_shading_color.push(colorShade[i + 2]);
          flat_shading_color.push(colorShade[i]);
          flat_shading_color.push(colorShade[i+1]);
          flat_shading_color.push(colorShade[i + 2]);
      }
        normals = normal_each_vertex;
        color = flat_shading_color;
        
    
        if(picked != anObjectIndex){
            for(var i = 0; i < color.length; i+=3){
                color[i] = color[i] + 0;
                color[i+1] = color[i+1] + 0;
                color[i+2] = color[i+2] + .8;
            }
        }else{
            for(var i = 0; i < color.length; i+=3){
                color[i] = color[i] + .11;
                color[i+1] = color[i+1] + .11;
                color[i+2] = color[i+2] + .11;
            }
        }
    
        var newcolorPhase = calculateColors(color, alpha); 
        
        var arr = new Float32Array(normalized_vertices_surfaceArray);

        var vertexBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);


        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
              
        var shaded_arr_color = new Float32Array(newcolorPhase);
        var colorBuffer = gl.createBuffer();
         
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, shaded_arr_color, gl.STATIC_DRAW);
    
        gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Color);

        
        gl.drawArrays(gl.TRIANGLES, 0, arr.length / 3);
        return true;    
}






