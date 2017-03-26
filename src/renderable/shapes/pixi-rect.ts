/**
 * The rendering parameters of a PIXIRect.
 */
type PIXIRectRenderingParameters = {
    // The width and height of the rectangle.
    width: number, height: number,
    // The radius of the corners, or 0.
    cornerRadius: number,
    // The fill color as a number. i.e. 0xFF0000 for red.
    fillColor: number,
    // The stroke color as a number.
    strokeColor: number,
    // The line width of the outline, or 0.
    lineWidth: number
};

/**
 * A basic rectangle that is renderable to PIXI (as opposed to a
 * PIXI.Rectangle), optionally with rounded corners.
 */
export class PIXIRect extends PIXI.Graphics {
    private options: PIXIRectRenderingParameters;

    constructor(width: number, height: number,
                options: {cornerRadius?: number, fillColor?: number,
                          strokeColor?: number, lineWidth?: number} = null) {
        super();
        this.options = {
            cornerRadius: options && (
                options.cornerRadius == null ? 5 : options.cornerRadius),
            fillColor: options && options.fillColor || 0,
            strokeColor: options && options.strokeColor,
            lineWidth: options && options.lineWidth || 0,
            width: width,
            height: height
        };
        this.updateGeometry();
    }

    /**
     * Set new parameters for the fill and stroke colors.
     */
    setColors(colors: {fill?: number, stroke?: number}) {
        if (colors.fill != null) {
            this.options.fillColor = colors.fill;
        }
        if (colors.stroke != null) {
            this.options.strokeColor = colors.stroke;
        }
        this.updateGeometry();
    }

    /**
     * Updates the path associated with this PIXI.Graphics object to accurately
     * represent the rectangle detailed by the options.
     */
    private updateGeometry() {
        let options = this.options;
        let width = options.width;
        let height = options.height;
        let radius = options.cornerRadius;

        /**
         * Below is a diagram of the order in which the rectangle is rendered.
         * The numbers coincide with comments on the lines below that are used
         * to construct the geometry for the rectangle.
         *
         *     8/0 --------------- 1
         *     /                     \
         *   7                         2
         *   |                         |
         *   |                         |
         *   |                         |
         *   |                         |
         *   6                         3
         *     \                     /
         *       5 --------------- 4
         */

        // NOTE: The arcs are sometimes imprecise when rendered, and having a
        // lineTo command after them helps make them look better. These lineTo
        // commands will be numbered as N.5, where N is the number of the arc.

        this.clear();
        this.beginFill(options.fillColor);
        this.lineStyle(options.lineWidth, options.strokeColor);
        this.moveTo(radius, 0);          // 0
        this.lineTo(width - radius, 0);  // 1
        if (radius > 0) {
            // (2) Top-right corner.
            this.arc(width - radius, radius,
                     radius, Math.PI / 2 * 3, Math.PI * 2);
        }
        this.lineTo(width, radius);           // 2.5
        this.lineTo(width, height - radius);  // 3
        if (radius > 0) {
            // (4) Bottom-right corner.
            this.arc(width - radius, height - radius,
                     radius, 0, Math.PI / 2);
        }
        this.lineTo(width - radius, height);  // 4.5
        this.lineTo(radius, height);          // 5
        if (radius > 0) {
            // (6) Bottom-left corner.
            this.arc(radius, height - radius,
                     radius, Math.PI / 2, Math.PI);
        }
        this.lineTo(0, height - radius);  // 6.5
        this.lineTo(0, radius);           // 7
        if (radius > 0) {
            // (8) Top-left corner.
            this.arc(radius, radius,
                     radius, Math.PI, Math.PI / 2 * 3);
        }
    }
}
