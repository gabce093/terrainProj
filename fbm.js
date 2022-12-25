import { createNoise2D } from 'simplex-noise';

const noise = createNoise2D();

export function fbm(octaves, octave_value, x, y) {
    var elevation = 0;
    var st = 1

    for (var i = 0; i < octaves.length; i += 1) {
        elevation += octaves[i] * noise(x * octave_value * st, y * octave_value * st);
        st *= 2;
    }

    return elevation;
}

export function ridgedFbm(octaves, octave_value, x, y) {
    var elevation = 0;
    var st = 1
    var n = 0;
    for (var i = 0; i < octaves.length; i += 1) {
        n = Math.abs(noise(x * (octave_value/3) * st, y * (octave_value/3) * st));
        n = (1 - n);
        elevation  += octaves[i]*n*n;
        st *= 2;
    }

    return elevation;
}