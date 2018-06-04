var projMatrix;
var u_ProjMatrix;
var view;
var u_ViewMatrix;
var gl; 

function uMatrix(orthoL, orthoR, orthoB, orthoT, 
        look_fromX, pan_xx, look_fromY, pan_yy, look_fromZ, look_atX, look_atY, look_atZ){

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