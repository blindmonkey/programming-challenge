let clamp = (num: number, min: number, max: number) =>
    Math.min(max, Math.max(min, num));

export class CoordUtils {
    /**
     * Given a coordinate and size (all in integers), this function will return
     * the index of that coordinate in a flat array.
     */
    static coordToIndex(x: number, y: number, width: number, height: number,
                        shouldClamp: boolean = true) {
        x = x | 0;
        y = y | 0;
        if (shouldClamp) {
            x = clamp(x, 0, width - 1);
            y = clamp(y, 0, height - 1);
        } else if (x < 0 || y < 0 || x >= width || y >= height) {
            return null;
        }
        return y * width + x;
    }

    /**
     * Given an index and size, this function will return the coordinate. This
     * function is the inverse of coordToIndex.
     */
    static indexToCoord(index: number, width: number) {
        index = index | 0;
        width = width | 0;
        let x = index % width;
        let y = (index - x) / width;
        return {x, y};
    }
}
