class Edge {
    constructor(args) {
        this.p0 = args.p0 || null;
        this.p1 = args.p1 || null;
        this.len = args.len || 0;
        this.stiffness = args.stiffness ?? 0.2;
    }

    init() {
        this.len = dist(this.p0.pos.x, this.p0.pos.y, this.p1.pos.x, this.p1.pos.y);
    }

    run() {
        const dx = this.p1.pos.x - this.p0.pos.x;
        const dy = this.p1.pos.y - this.p0.pos.y;
        const d = dist(this.p0.pos.x, this.p0.pos.y, this.p1.pos.x, this.p1.pos.y);
        const diff = (this.len - d);

        // const percent = diff / d / 2;
        const percent = (diff / d / 2) * this.stiffness;
        const offsetX = dx * percent;
        const offsetY = dy * percent;

        this.p0.pos.x -= offsetX;
        this.p0.pos.y -= offsetY;
        this.p1.pos.x += offsetX;
        this.p1.pos.y += offsetY;

    }
    draw() {
        push();
        stroke(0);
        noFill();
        line(this.p0.pos.x, this.p0.pos.y, this.p1.pos.x, this.p1.pos.y);
        pop();
    }
}