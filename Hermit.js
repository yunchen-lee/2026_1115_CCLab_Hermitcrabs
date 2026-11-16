class Hermit {
    constructor(args) {
        this.pos = args.pos || createVector(width / 2, height / 2);
        this.softBodys = [];
        this.size = 50;
        this.body = null;
        this.frontClaw = null;
        this.backClaw = null;
        this.legs = [];
        this.eyes = [];

        this.anchors = [];
        this.anchorStiffness = 0.5;
        this.anchorIterations = 5;

        this.facing = -1; // -1 = facing left (how it's built), 1 = facing right
        this.speed = 3; // pixels per frame when moving
        this.jumpPower = 12; // upward speed when jumping (jump height ≈ jumpPower² / (2 * GRAVITY))

        this.skeleton = null;
        this.skeletonStiffness = 0.15; // how strongly the whole crab keeps its pose (0..1)

        this.showEdges = true; // show springs (edges) on top of the filled shapes
        this.debug = false; // true = show springs, points and point indices
    }

    setup() {
        let s = this.size;

        // back claw (smaller, behind the body) ---------------
        this.backClaw = this.makePart(this.clawShape(random(0.65, 0.8)), -0.55 * s, -0.15 * s);

        // body -------------------------
        let body = new SoftBody({
            pos: this.pos,
            edgeStiffness: 0.9, // every part hangs on the body, so it must be firm
            shapeStiffness: 0.5,
            iterations: 10
        });
        this.softBodys.push(body);
        this.body = body;

        for (let i = 0; i < 5; i++) {
            let angle = (2 * PI / 5) + i * TWO_PI / 5
            if (i >= 2) { angle += random(-PI / 6, PI / 6); }

            let x = s * cos(angle);
            let y = s * sin(angle);
            body.addPoint(x, y);
        }
        body.addPoint(0, 0);

        for (let i = 0; i < 5; i++) {
            body.addEdge(body.pts[i], body.pts[(i + 1) % 5]);
            body.addEdge(body.pts[i], body.pts[5]);
        }
        body.lockRotation = true;
        body.outlineCount = 5; // pts[5] is the center point, not part of the outline
        body.setupResetShape();


        let legXs = [-0.35, 0.0, 0.35, 0.7];
        legXs.forEach(lx => {
            let len = s * random(1.0, 1.25);
            let w = s * random(0.2, 0.26);
            let tilt = -0.35 + random(-0.1, 0.1); // negative = top leans left
            let segments = floor(random(3, 5)); // 3 or 4 X-braced cells
            this.legs.push(this.makeLeg(len, w, tilt, segments, lx * s, 0.75 * s));
        });


        this.frontClaw = this.makePart(this.clawShape(random(0.95, 1.15)), -0.95 * s, 0.35 * s);


        let eyeXs = [-0.5, -0.2];
        let eyeYs = [-0.95, -1.05];
        eyeXs.forEach((ex, i) => {
            let len = s * random(0.6, 0.8);
            let w = s * random(0.16, 0.2);
            let tilt = -0.3 + random(-0.1, 0.1); // top leans left, toward the front
            this.eyes.push(this.makeLeg(len, w, tilt, 2, ex * s, eyeYs[i] * s));
        });

        // anchors: attach every part to the body ---------------
        this.eyes.forEach(eye => this.connect([eye.L[eye.L.length - 1], eye.R[eye.R.length - 1]])); // bottom two corners of each stalk
        this.legs.forEach(leg => this.connect([leg.L[0], leg.R[0]])); // top two corners of each leg
        this.connect([this.frontClaw.pts[2], this.frontClaw.pts[3]]); // claw's right side (toward body)
        this.connect([this.backClaw.pts[2], this.backClaw.pts[3]]);

        this.skeleton = new SoftBody({
            lockRotation: true,
            shapeStiffness: this.skeletonStiffness
        });
        this.softBodys.forEach(sb => this.skeleton.pts.push(...sb.pts));
        this.skeleton.setupResetShape();
    }


    connect(partPoints, stiffness = this.anchorStiffness) {
        partPoints.forEach(pp => {
            let nearest = [...this.body.pts]
                .sort((a, b) => dist(pp.pos.x, pp.pos.y, a.pos.x, a.pos.y) - dist(pp.pos.x, pp.pos.y, b.pos.x, b.pos.y))
                .slice(0, 2);

            nearest.forEach(bp => {
                let a = new Anchor({ p0: bp, p1: pp, stiffness });
                a.init(); // rest length = current distance, so the part stays where it was built
                this.anchors.push(a);
            });
        });
    }


    drawEyeball(eye) {
        let x = 0;
        let y = 0;
        eye.topCap.forEach(p => {
            x += p.pos.x;
            y += p.pos.y;
        });
        x /= eye.topCap.length;
        y /= eye.topCap.length;

        let d = eye.w * 1.1;
        push();
        stroke(0);
        strokeWeight(2);
        fill(30);
        circle(x, y, d);
        noStroke();
        fill(255);
        circle(x + d * 0.18 * this.facing, y - d * 0.18, d * 0.25);
        pop();
    }


    move(dir) {
        if (dir !== this.facing) this.flip();


        this.skeleton.pts.forEach(p => {
            p.pos.x += dir * this.speed;
            p.pre.x += dir * this.speed;
        });
    }


    isOnGround() {
        return this.skeleton.pts.some(p => p.pos.y >= height - p.radius - 1);
    }


    jump() {
        if (!this.isOnGround()) return;


        this.skeleton.pts.forEach(p => {
            p.pre.y = p.pos.y + this.jumpPower;
        });
    }


    // AI code
    flip() {
        let cx = this.skeleton.centroid().x;


        this.skeleton.pts.forEach(p => {
            let vx = p.pos.x - p.pre.x;
            p.pos.x = 2 * cx - p.pos.x;
            p.pre.x = p.pos.x - vx;
        });


        [...this.softBodys, this.skeleton].forEach(sb => {
            sb.resetShape.forEach(r => {
                r.x = -r.x;
            });
        });

        this.facing *= -1;
    }

    run() {
        for (let i = 0; i < this.anchorIterations; i++) {
            this.anchors.forEach(a => a.run());
        }
        this.skeleton.shapeMatch();
    }


    makePart(localPts, offsetX, offsetY) {
        let sb = new SoftBody({
            pos: createVector(this.pos.x + offsetX, this.pos.y + offsetY),
            lockRotation: true
        });
        localPts.forEach(p => sb.addPoint(p.x, p.y));

        let n = sb.pts.length;
        let half = floor(n / 2);
        for (let i = 0; i < n; i++) {
            sb.addEdge(sb.pts[i], sb.pts[(i + 1) % n]);
            sb.addEdge(sb.pts[i], sb.pts[(i + 2) % n]);
            if (i < half) sb.addEdge(sb.pts[i], sb.pts[i + half]);
        }

        sb.setupResetShape();
        this.softBodys.push(sb);
        return sb;
    }


    // AI code
    clawShape(scale) {
        let k = this.size * scale;
        let unit = [
            [-0.45, -0.55], // top-left (upper jaw back)
            [0.30, -0.55], // top-right
            [0.50, -0.30], // right upper
            [0.50, 0.35], // right lower
            [0.30, 0.60], // bottom-right
            [-0.30, 0.60], // bottom-left
            [-0.50, 0.35], // left lower
            [-0.50, 0.12], // lower jaw tip
            [-0.10, 0.12], // notch inner bottom
            [-0.10, -0.08], // notch inner top
            [-0.58, -0.20], // upper jaw tip
        ];
        return unit.map(([x, y]) => createVector(x * k, y * k));
    }

    makeLeg(len, w, tilt, segments, offsetX, offsetY) {
        let sb = new SoftBody({
            pos: createVector(this.pos.x + offsetX, this.pos.y + offsetY),
            lockRotation: true,
            edgeStiffness: 0.9,
            shapeStiffness: 0.3,
            iterations: 5
        });

        let r = w / 2;
        let half = len / 2 - r;
        let capSteps = 4;
        let add = (x, y) => {
            let v = createVector(x, y).rotate(tilt);
            return sb.addPoint(v.x, v.y);
        };
        let rungY = k => -half + (k / segments) * 2 * half;

        let L = [];
        let R = [];
        let topCap = [];
        let bottomCap = [];


        // AI code
        let L0 = add(-r, rungY(0));
        for (let j = 1; j < capSteps; j++) {
            let a = PI + (j / capSteps) * PI;
            topCap.push(add(r * cos(a), rungY(0) + r * sin(a)));
        }
        for (let k = 0; k <= segments; k++) {
            R.push(add(r, rungY(k)));
        }
        for (let j = 1; j < capSteps; j++) {
            let a = (j / capSteps) * PI;
            bottomCap.push(add(r * cos(a), rungY(segments) + r * sin(a)));
        }
        let leftUp = [];
        for (let k = segments; k >= 1; k--) {
            leftUp.push(add(-r, rungY(k)));
        }
        L = [L0, ...leftUp.reverse()];
        // AI code end

        let n = sb.pts.length;
        for (let i = 0; i < n; i++) {
            sb.addEdge(sb.pts[i], sb.pts[(i + 1) % n]);
        }


        for (let k = 0; k <= segments; k++) {
            sb.addEdge(L[k], R[k]);
            if (k < segments) {
                sb.addEdge(L[k], R[k + 1]);
                sb.addEdge(R[k], L[k + 1]);
            }
        }


        topCap.forEach(p => {
            sb.addEdge(p, L[0]);
            sb.addEdge(p, R[0]);
        });
        bottomCap.forEach(p => {
            sb.addEdge(p, L[segments]);
            sb.addEdge(p, R[segments]);
        });

        sb.L = L;
        sb.R = R;
        sb.topCap = topCap;
        sb.w = w;

        sb.setupResetShape();
        this.softBodys.push(sb);
        return sb;
    }

    draw() {

        // if (this.showEdges) {
        //     push();
        //     stroke(0);
        //     strokeWeight(1);
        //     this.softBodys.forEach(sb => {
        //         sb.edges.forEach(e => {
        //             line(e.p0.pos.x, e.p0.pos.y, e.p1.pos.x, e.p1.pos.y);
        //         });
        //     });
        //     pop();
        // }

        // back to front
        this.backClaw.drawShape(200);
        this.eyes.forEach(eye => {
            eye.drawShape(235); // stalk, behind the body so its base is hidden
            this.drawEyeball(eye);
        });
        this.body.drawShape(245);
        this.legs.forEach(leg => leg.drawShape(235));
        this.frontClaw.drawShape(255);

        this.anchors.forEach(a => a.draw());


        if (this.debug) {
            this.softBodys.forEach(sb => {
                sb.draw();
                sb.pts.forEach((p, i) => {
                    push();
                    noStroke();
                    fill(0);
                    text(i, p.pos.x + 6, p.pos.y + 6);
                    pop();
                });
            });
        }
    }
}