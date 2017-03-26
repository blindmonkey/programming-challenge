/**
 * Represents an arrow that would be contained within a single square of a
 * `Board`. `angle` represents the direction the arrow points in, and the
 * `velocity` represents the change in that angle per frame.
 *
 * `angle` is represented as a value between [0, 4), where each integer 0-3
 * represents a discrete direction the arrow can point in. 0 means the arrow
 * points right, 1 means the arrow points down, 2 means the arrow points left,
 * and 3 means the arrow points down. To convert to radians, multiply by PI/2.
 * To convert to degrees, multiply by 90°.
 *
 * The format for angle was chosen purely for its convenient ability to
 * simultaneously represent discrete directions as well as continuous ones.
 */
export type ArrowSquareType = {
    angle: number,
    velocity: number,
};
