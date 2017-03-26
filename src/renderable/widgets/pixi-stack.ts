type PIXIStackOptions = {
    padding?: number,
    separation?: number,
};

/**
 * A simple class that keeps the common options between the vertical and
 * horizontal stacks. Currently, two options are supported:
 * padding: the amount of space around the elements in the stack.
 * separation: the amount of space between the elements in the stack.
 */
class PIXIStack extends PIXI.Container {
    protected padding: number;
    protected separation: number;

    constructor(options?: PIXIStackOptions) {
        super();
        this.padding = options && options.padding || 0;
        this.separation = options && options.separation || 0;
    }
}

/**
 * A horizontal stack that lays out its children when they are added. It is
 * expected that the size changes of the children (if any) do not affect the
 * positioning of the other children. Stacks from left to right.
 */
export class PIXIHStack extends PIXIStack {
    constructor(options?: PIXIStackOptions) {
        super(options);
    }

    public addChild(child: PIXI.Container) {
        let lastChild = this.children.length > 0 ?
            this.children.slice(-1)[0] : null;
        let lastChildRect = lastChild == null ? null : lastChild.getBounds();
        super.addChild(child);
        child.position.x = (lastChildRect == null ? this.padding :
            (lastChildRect.right - this.getBounds().left + this.separation));
        child.position.y = this.padding;
    }
}

/**
 * A vertical stack that lays out its children when they are added. It is
 * expected that the size changes of the children (if any) do not affect the
 * positioning of the other children. Stacks from top to bottom.
 */
export class PIXIVStack extends PIXIStack {
    constructor(options?: PIXIStackOptions) {
        super(options);
    }

    public addChild(child: PIXI.Container) {
        let lastChild = this.children.length > 0 ?
            this.children.slice(-1)[0] : null;
        let lastChildRect = lastChild == null ? null : lastChild.getBounds();
        super.addChild(child);
        child.position.x = this.padding;
        child.position.y = (lastChildRect == null ? this.padding :
            (lastChildRect.bottom - this.getBounds().top + this.separation));
    }
}
