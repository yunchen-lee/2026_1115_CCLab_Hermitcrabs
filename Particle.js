// Some Reference:
// https://github.com/treedbox/codingmath/blob/master/js/coding-math.36.verlet-integration-part-01.js



class Particle {
    constructor(args) {
        this.mass = args.mass || 1;
        this.radius = args.radius || 4;
        this.pos = args.pos || createVector(width / 2, height / 2);
        const vel = args.vel || createVector(0, 0);
        this.pre = createVector(this.pos.x - vel.x, this.pos.y - vel.y);
    }


    run() {
        // Read velocity before pre is overwritten
        const vx = (this.pos.x - this.pre.x) * FRICTION;
        const vy = (this.pos.y - this.pre.y) * FRICTION;

        this.pre.x = this.pos.x;
        this.pre.y = this.pos.y;

        this.pos.x += vx;
        this.pos.y += vy + GRAVITY;

        const r = this.radius;

        if (this.pos.x > width - r) {
            this.pos.x = width - r;
            this.pre.x = this.pos.x + vx * BOUNCE;
        } else if (this.pos.x < r) {
            this.pos.x = r;
            this.pre.x = this.pos.x + vx * BOUNCE;
        }

        if (this.pos.y > height - r) {
            this.pos.y = height - r;
            this.pre.y = this.pos.y + vy * BOUNCE;
        } else if (this.pos.y < r) {
            this.pos.y = r;
            this.pre.y = this.pos.y + vy * BOUNCE;
        }

        // floor friction: a point touching the floor loses some sideways speed every frame
        if (this.pos.y >= height - r) {
            this.pre.x = this.pos.x - vx * GROUND_FRICTION;
        }
    }


    draw() {
        push();
        translate(this.pos.x, this.pos.y);
        fill(0);
        circle(0, 0, this.radius * 2);
        pop();
    }
}