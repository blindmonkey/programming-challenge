let ButtonState = {
    HOVER: 'hover',
    DOWN: 'down',
    NORMAL: 'normal'
};


/**
 * This class encapsulates the logic for state transitions on a button. It emits
 * events when a button should change the state, with each different event
 * signifying a different state.
 */
export class ButtonStateHandler {
    // The target PIXI object that will be receiving events.
    private target: PIXI.Container;
    // Handlers for the events we will be firing, so that we don't leak events
    // to anyone outside this file.
    private handlers: {[key: string]: Array<() => void>};
    private mouse: {down: boolean, inside: boolean};

    constructor(target: PIXI.Container) {
        this.target = target;
        this.handlers = {};
        this.mouse = {down: false, inside: false};

        this.target.interactive = true;
        this.target.buttonMode = true;
        this.target.on('pointerdown', () => this.handleMouseDown());
        this.target.on('pointerup', () => this.handleMouseUp());
        this.target.on('pointerupoutside', () => this.handleMouseUp());
        this.target.on('pointermove', (event) => this.handleMouseMove(event));
    }

    /**
     * Handler for a PIXI pointerdown event.
     */
    private handleMouseDown() {
        // When we get this event, the mouse is guaranteed to be inside the
        // button.
        this.mouse.inside = true;
        this.mouse.down = true;
        this.fire(ButtonState.DOWN);
    }

    /**
     * Handler for a PIXI pointerup event.
     */
    private handleMouseUp() {
        this.fire(this.mouse.inside ? ButtonState.HOVER : ButtonState.NORMAL);
        this.mouse.down = false;
    }

    /**
     * Handler for a PIXI pointermove event. This method controls the state of
     * `mouse.inside`, and possibly fires ButtonState.HOVER and
     * ButtonState.NORMAL events when the state changes.
     */
    private handleMouseMove(event: PIXI.interaction.InteractionEvent) {
        // Ignore the event entire if the mouse button is not down.
        let position = event.data.global;
        // Determine whether the pointer is inside the bounds of the button.
        let isPointerInside = !(
            position.x < this.target.position.x ||
            position.y < this.target.position.y ||
            position.x > this.target.position.x + this.target.width ||
            position.y > this.target.position.y + this.target.height);
        if (isPointerInside !== this.mouse.inside) {
            // If the "inside" state has changed, we need to raise the correct
            // events so that the button appearance can change.
            this.mouse.inside = isPointerInside;
            if (!this.mouse.down) {
                if (isPointerInside) {
                    this.fire(ButtonState.HOVER);
                } else {
                    this.fire(ButtonState.NORMAL);
                }
            }
        }
    }

    /** A private function to register a listener for an arbitrary event. */
    private listen(event: string, handler: () => void): ButtonStateHandler {
        if (this.handlers[event] == null) {
            this.handlers[event] = [];
        }
        this.handlers[event].push(handler);
        return this;
    }

    /** A private function to fire the given event. */
    private fire(event: string) {
        let handlers = this.handlers[event];
        if (handlers != null) {
            for (let i = 0; i < handlers.length; i++) {
                handlers[i]();
            }
        }
    }

    /** Registers a hover handler. */
    whenHovered(handler: () => void) {
        return this.listen(ButtonState.HOVER, handler);
    }

    /** Registers a button down handler. */
    whenDown(handler: () => void) {
        return this.listen(ButtonState.DOWN, handler);
    }

    /** Registers a button normal handler. */
    whenNormal(handler: () => void) {
        return this.listen(ButtonState.NORMAL, handler);
    }
}
