/**
 * Represents the checker at some position on the board. `x` and `y` should be
 * integers that together form the coordinate of the square on the `Board`.
 */
export class Checker {
    // The `x` and `y` components of the coordinate of the location of this
    // `Checker` on a `Board`.
    private x: number;
    private y: number;
    // A floating point offset that is used to animate the checker to its new
    // position. Both `x` and `y` should be between -1 and 1.
    private offset: {x: number, y: number};

    constructor(x: number, y: number) {
        this.x = x | 0;
        this.y = y | 0;
        this.offset = {x: 0, y: 0};
    }

    /** Returns the position of this checker. */
    getPosition() { return {x: this.x, y: this.y}; }

    /** Sets the position of this `Checker` on a `Board`. */
    setPosition(x: number, y: number) {
        this.x = x | 0;
        this.y = y | 0;
        return this;
    }

    /** Returns the floating point offset of this `Checker`. */
    getOffset(): {x: number, y: number} {
        return {x: this.offset.x, y: this.offset.y};
    }

    /** Sets the floating point offset of this `Checker`. */
    setOffset(dx: number, dy: number) {
        this.offset.x = dx;
        this.offset.y = dy;
        return this;
    }

    /** Returns the sum of the position and the offset. */
    getOffsetPosition(): {x: number, y: number} {
        return {x: this.x + this.offset.x,
                y: this.y + this.offset.y};
    }
}
