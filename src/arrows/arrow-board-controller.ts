import { ArrowSquareType } from './arrows';
import { BoardRenderer } from '../board/board-renderer';
import { Board } from '../board/board';

/**
 * A board controller that knows about `Board`s with arrows. Allows us to rotate
 * arrows within the board on update, as well as initiate the rotation of those
 * arrows.
 */
export class ArrowBoardController {
    private board: Board<ArrowSquareType>;

    constructor(board: Board<ArrowSquareType>) {
        this.board = board;
    }

    /**
     * Gets the difference of two angles represented in the form described in
     * {@see ArrowSquareType}.
     */
    private getAngleDifference(angle1: number, angle2: number) {
        angle1 = angle1 % 4;
        if (angle1 < 0) angle1 += 4;
        angle2 = angle2 % 4;
        if (angle2 < 0) angle2 += 4;
        // The logic here is to support the following cases:
        // angle1 = 0.1, angle2 = 3.9
        // angle1 = 3.9, angle2 = 0.1
        return Math.min(Math.abs(angle1 - angle2),
                        Math.abs(angle1 - (angle2 + 4)),
                        Math.abs(angle1 - (angle2 - 4)));
    }

    /**
     * Updates the angle and velocity of all the spinning arrows on the board.
     * Returns true if any arrows are still spinning.
     */
    update() {
        let spinning = false;
        this.board.map((value: ArrowSquareType, x: number, y: number) => {
            if (value != null && value.velocity !== 0) {
                // If it's a non-null square, and the arrow has spinning
                // velocity, update its angle based on its velocity.
                value.angle += value.velocity;
                // Correct the angle to be between [0, 4).
                if (value.angle < 0) value.angle += 4;
                if (value.angle >= 4) value.angle -=4;
                // Dampen the velocity to achieve a slowdown effect.
                value.velocity *= 0.99;
                // Floats are hard, so we need some threshold at which we'll
                // decide that we should stop the arrow if it points in a valid
                // direction.
                let absVelocity = Math.abs(value.velocity);
                let almostStoppedVelocity = 0.02;
                let almostStopped = absVelocity < almostStoppedVelocity;
                // Represents the difference between the nearest discrete angle
                // position and the current angle position. If they are close
                // enough, and the arrow is spinning slowly enough, we stop the
                // arrow on the discrete direction.
                let angularDifference = this.getAngleDifference(
                    value.angle, Math.round(value.angle));
                if (almostStopped && angularDifference < 0.01) {
                    // Stop the arrow from spinning and snap it to the nearest
                    // discrete angle.
                    value.velocity = 0;
                    value.angle = Math.round(value.angle) % 4;
                } else {
                    // If the arrow has practically stopped, and we aren't close
                    // to a discrete angle, give it a small kick in a random
                    // direction.
                    if (absVelocity < almostStoppedVelocity / 10) {
                        value.velocity += Math.random() * 0.2 - 0.1
                    }
                    spinning = true;
                }
            }
            return value;
        });
        return spinning;
    }

    /**
     * Sets a random rotational velocity on all arrows.
     */
    initiateRotation() {
        this.board.map((value: ArrowSquareType, x: number, y: number) => {
            if (value != null) {
                let velocityBase = (Math.random() - .5) / 2;
                let velocitySign = velocityBase >= 0 ? 1 : -1;
                value.velocity += velocityBase + velocitySign * 0.4;
            }
            return value;
        });
    }
}
