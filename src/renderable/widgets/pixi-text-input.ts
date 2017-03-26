import { PIXIRect } from '../shapes/pixi-rect';


/**
 * The options that are accepted by PIXITextInput to describe its appearance.
 */
type PIXITextInputStyle = {
    // The style of the text itself.
    text?: PIXI.TextStyleOptions,
    // The color of the text fill.
    color?: number,
    // The style of the text outline.
    border?: {
        width?: number,
        color?: number
    }
};


/**
 * A (very) simple text input field with rudimentary focus support.
 * The following features could be supported, but are not:
 * - Multiline text
 * - Horizontal scrolling
 * - Text selection
 * - Copy paste
 * - Moving the cursor via the mouse
 * - Moving the cursor via the up and down arrows
 *
 * This component will emit a 'focus' event when it is clicked
 */
export class PIXITextInput extends PIXI.Container {
    // A function that converts a keyCode to a string.
    private keyCodeToChar: (key: number) => string;
    // A function that returns true when a key should be accepted as a typable
    // character.
    private keyFilter: (key: number) => boolean;

    // The current text of the input.
    private text: string;
    // The amount of padding around the text.
    private padding: number;
    // The maximum allowed length, or null if none exists (not recommended).
    private maxLength: number;
    // The index into the text representing where the cursor currently is.
    private cursor: number;
    // Whether this control is focused. When a text input is focused, all key
    // events will be sent to it. It is recommended that things are arranged in
    // a way where only one element is focused at a time.
    private focused: boolean;

    // The object used to measure text to place the cursor.
    private measureTextObject: PIXI.Text;
    // The object representing the actual displayed text.
    private textObject: PIXI.Text;
    // The object representing the cursor.
    private cursorObject: PIXI.Graphics;
    // The rect outline of the text input
    private outline: PIXIRect;

    constructor(text: string, width: number, height: number,
                style: PIXITextInputStyle = null) {
        super();

        // Initialize the properties and variables that affect visual
        // appearance.
        let cornerRadius = 4;
        this.padding = 5;
        this.text = text;

        this.focused = false;
        this.cursor = 0;

        let backgroundColor = style && style.color;
        if (backgroundColor == null) backgroundColor = 0xFFFFFF;

        // Initialize the graphic objects.
        this.outline = new PIXIRect(width, height, {
            cornerRadius: cornerRadius, fillColor: backgroundColor,
            strokeColor: style && style.border && style.border.color || 0,
            lineWidth: style && style.border && style.border.width || 0});
        this.addChild(this.outline);

        this.measureTextObject = new PIXI.Text('', style.text);
        this.textObject = new PIXI.Text(this.text, style.text);
        this.textObject.position.x = this.padding;
        this.textObject.position.y = this.padding;
        this.addChild(this.textObject);

        this.cursorObject = this.buildTextCursor();
        this.addChild(this.cursorObject);
        this.moveCursor(0);
        this.cursorObject.alpha = 0;

        // Initialize the interactivity logic.
        this.interactive = true;
        this.on('pointerdown', function() {
            // Focus on this text input.
            this.focused = true;
            this.cursorObject.alpha = 1;
            this.emit('focus');
        }.bind(this));

        this.on('unfocus', function() {
            // If something emits an unfocus event on this text input, it should
            // react.
            this.focused = false;
            this.cursorObject.alpha = 0;
        });

        document.addEventListener('keydown', function(e) {
            // Ignore keys when not focused.
            if (!this.focused) return;
            this.handleKeyDown(e.keyCode);
        }.bind(this));
    }

    private buildTextCursor(): PIXI.Graphics {
        let cursorObject = new PIXI.Graphics();
        cursorObject.beginFill(0);
        cursorObject.moveTo(-1, this.padding);
        cursorObject.lineTo(-1, this.outline.height - this.padding);
        cursorObject.lineTo(0, this.outline.height - this.padding);
        cursorObject.lineTo(0, this.padding);
        return cursorObject;
    }

    private handleKeyDown(keyCode: number) {
        if (keyCode === 37) { // left
            this.moveCursor(Math.max(0, this.cursor - 1));
        } else if (keyCode === 39) { // right
            this.moveCursor(Math.min(this.text.length, this.cursor + 1));
        } else if (keyCode === 8) { // backspace
            let firstHalf = this.text.slice(0, Math.max(0, this.cursor - 1));
            let secondHalf = this.text.slice(this.cursor);
            this.moveCursor(this.cursor - 1);
            this.updateText(firstHalf + secondHalf);
        } else if (keyCode === 46) { // delete
            let firstHalf = this.text.slice(0, this.cursor);
            let secondHalf = this.text.slice(
                Math.min(this.text.length, this.cursor + 1));
            this.updateText(firstHalf + secondHalf);
        } else if (this.keyFilter == null || this.keyFilter(keyCode)) {
            let str = this.keyCodeToChar(keyCode);
            if (this.updateText(this.text.slice(0, this.cursor) + str +
                    this.text.slice(this.cursor))) {
                this.moveCursor(this.cursor + 1);
            }
        }
    }

    /**
     * Updates the displayed text, unless the text is too long.
     * Returns true if the text was updated.
     */
    private updateText(newText: string) {
        if (this.maxLength != null && newText.length > this.maxLength) {
            return false;
        }
        this.text = newText;
        this.textObject.text = newText;
        this.moveCursor(this.cursor);
        return true;
    }

    /**
     * Measures the given text.
     */
    private measureText(text: string) {
        this.measureTextObject.text = text;
        return {
            width: this.measureTextObject.width,
            height: this.measureTextObject.height
        };
    }

    /**
     * Moves the cursor to `newPosition`, which should be between 0 and
     * this.text.length (inclusive).
     */
    private moveCursor(newPosition: number) {
        if (newPosition < 0) newPosition = 0;
        if (newPosition > this.text.length) newPosition = this.text.length;

        let textPart = this.text.slice(0, newPosition);
        this.cursor = newPosition;
        let measuredWidth = textPart.length > 0 ?
            this.measureText(textPart).width : 0;
        this.cursorObject.position.x = measuredWidth + this.padding;
    }

    /** Gets the value of the currently entered text. */
    getText() { return this.text; }

    /** Sets the keycode converter. */
    setKeyCodeConverter(converter: (keyCode: number) => string) {
        this.keyCodeToChar = converter;
        return this;
    }

    /** Sets the max length. */
    setMaxLength(maxLength: number) {
        this.maxLength = maxLength;
        return this;
    }

    /** Sets the key filter. */
    setKeyFilter(filter: (keyCode: number) => boolean) {
        this.keyFilter = filter;
        return this;
    }
}
