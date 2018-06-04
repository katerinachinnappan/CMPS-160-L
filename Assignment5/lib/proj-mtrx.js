var projMatrix;
var u_ProjMatrix;
var view;
var u_ViewMatrix;
var gl; 

function uMatrix(){
    u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');  
    projMatrix = new Matrix4();
    
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');  
    view = new Matrix4();


    projMatrix.setOrtho(-500.0, 500.0, -500.0, 500.0, 1, 1800);
    view.setIdentity();
    view.lookAt(0, 0, 1000, 0, 0, 0, 0, 1, 0);
    console.log("view: " + view);

    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, view.elements);
}