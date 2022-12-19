export const hwFrag = `
    uniform float offset;
    varying vec3 p;

    void main() {
        float road = abs(p.x) < 1.5 ? 1.0 : 0.0;
        float strips = mod(p.y+offset, 50.0) < 25.0 ? 0.0 : 1.0;
        float full = road*strips;

        gl_FragColor = vec4(full, 0.0, 0.0, 1.0);
    }
`;

export const hwVert = `
    uniform float offset;
    varying vec3 p;

    void main() {
        p = position;
        gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0);
    }
`;