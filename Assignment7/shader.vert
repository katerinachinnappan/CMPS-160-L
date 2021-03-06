// this is the vertex shader: it is called for each vertex you pass from your code
// a single vertex is primarily the position, but can also contain information about color/normal/etc

// attribute variables are properties of a vertex
// these are passed from the main code (javascript) using 'gl.bufferData'
attribute vec4 a_Position; // Position of vertex
attribute float a_PointSize; // Size of points
attribute vec4 a_Color;
attribute vec2 a_TexCoord;
varying vec2 v_TexCoord;

// uniform variables are global porperties applied uniformly to all vertices
// these are also passed from the main code (javascript) using 'gl.uniform[1,2,3,4][i,f]'
// for example, 'uniform1i' sets [1] [i]nt, 'uniform4f' sets a vector of [4] [f]loats
uniform int u_Invert; // Boolean to decide whether to invert colors (0 == false, else true)
uniform int u_Flip; // Boolean to decide whether to flip vertices
uniform vec2 u_FlipDir; // Direction in which to flip (over origin)
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjMatrix;

// varying variables are passed from the vertex shader to the fragment shader, and are interpolated
varying vec4 v_Color; // Color to be passed to fragment shader

void main() {
  gl_Position = u_ProjMatrix * u_ViewMatrix * a_Position;
  v_Color = a_Color;
  v_TexCoord = a_TexCoord;
  // if (u_Invert == 0) {
  //   v_Color = vec4(0.0, 1.0, 0.0, 1.0);
  // } else {
  //   v_Color = vec4(0.0, .0, 1.0, 1.0);
  // }
}
