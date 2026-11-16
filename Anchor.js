class Anchor extends Edge {
    constructor(args) {
        super(args);
        this.broken = false;
        this.maxStretch = args.maxStretch || 3;
    }

    run() {
        if (this.broken) return;

        let d = dist(this.p0.pos.x, this.p0.pos.y, this.p1.pos.x, this.p1.pos.y);
        if (d > max(this.len, 5) * this.maxStretch) {
            this.broken = true;
            return;
        }
        super.run();
    }

    tryBreak(chance) {
        if (random() < chance) this.broken = true;
    }

    draw() {
        if (this.broken) return;
        // push();
        // stroke(255, 0, 0);
        // strokeWeight(1.5);
        // line(this.p0.pos.x, this.p0.pos.y, this.p1.pos.x, this.p1.pos.y);
        // pop();
    }
}