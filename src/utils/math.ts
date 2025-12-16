/**
 * Math utility functions.
 */

/**
 * Clamp a value between min and max.
 * @param value The value to clamp
 * @param min Minimum value
 * @param max Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values.
 * @param start Start value
 * @param end End value
 * @param t Interpolation factor (0-1)
 * @returns Interpolated value
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Inverse linear interpolation - find t given start, end, and value.
 * @param start Start value
 * @param end End value
 * @param value The value to find t for
 * @returns The t value (may be outside 0-1 if value is outside range)
 */
export function inverseLerp(start: number, end: number, value: number): number {
  if (start === end) return 0;
  return (value - start) / (end - start);
}

/**
 * Remap a value from one range to another.
 * @param value The value to remap
 * @param fromMin Source range minimum
 * @param fromMax Source range maximum
 * @param toMin Target range minimum
 * @param toMax Target range maximum
 * @returns Remapped value
 */
export function remap(
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number
): number {
  const t = inverseLerp(fromMin, fromMax, value);
  return lerp(toMin, toMax, t);
}

/**
 * Convert degrees to radians.
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees.
 * @param radians Angle in radians
 * @returns Angle in degrees
 */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Normalize an angle to the range 0-360 degrees.
 * @param degrees Angle in degrees
 * @returns Normalized angle
 */
export function normalizeAngle(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/**
 * Check if two numbers are approximately equal.
 * @param a First number
 * @param b Second number
 * @param epsilon Tolerance (default 0.0001)
 * @returns True if approximately equal
 */
export function approxEqual(a: number, b: number, epsilon: number = 0.0001): number {
  return Math.abs(a - b) < epsilon ? 1 : 0;
}

/**
 * Round to a specified number of decimal places.
 * @param value The value to round
 * @param decimals Number of decimal places
 * @returns Rounded value
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Generate a random number between min and max (inclusive).
 * @param min Minimum value
 * @param max Maximum value
 * @returns Random number
 */
export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Generate a random integer between min and max (inclusive).
 * @param min Minimum value
 * @param max Maximum value
 * @returns Random integer
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}
