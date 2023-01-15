import { createNoise2D } from "simplex-noise";

const noise = createNoise2D();

export function fbm(amplitudes, start_frequency, x, y) {
  var elevation = 0;
  var st = 1;

  for (var i = 0; i < amplitudes.length; i += 1) {
    elevation +=
      amplitudes[i] * noise(x * start_frequency * st, y * start_frequency * st);
    st *= 2;
  }

  return elevation;
}

export function ridgedFbm(amplitudes, start_frequency, x, y) {
  var elevation = 0;
  var st = 1;
  var n = 0;
  for (var i = 0; i < amplitudes.length; i += 1) {
    n = Math.abs(
      noise(x * (start_frequency / 3) * st, y * (start_frequency / 3) * st)
    );
    n = 1 - n;
    elevation += amplitudes[i] * n * n;
    st *= 2;
  }

  return elevation;
}
