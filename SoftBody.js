class SoftBody {
    constructor(args) {
        this.pos = args.pos || createVector(width / 2, height / 2);
        this.pts = args.pts || [];
        this.edges = args.edges || [];

        this.resetShape = null;
        // this.centroid = null;
        this.shapeStiffness = args.shapeStiffness || 0.05;
        this.edgeStiffness = args.edgeStiffness || 0.2;
        this.iterations = args.iterations || 1; // how many times edges are solved per frame
        this.frame = null;

        this.lockRotation = args.lockRotation || false;

    }

    // setup() {
    //     this.createBox();
    // }

    // createBox() {
    //     let temp = []

    //     let x = random(100, width - 100);
    //     let y = random(100, height - 100);
    //     let size = 100;


    //     temp.push(new Particle({
    //         pos: createVector(x, y),
    //         vel: createVector(Math.random() * 30 - 15, Math.random() * 30 - 15)
    //     }))
    //     temp.push(new Particle({
    //         pos: createVector(x + size, y),
    //         vel: createVector(Math.random() * 30 - 15, Math.random() * 30 - 15)
    //     }))
    //     temp.push(new Particle({
    //         pos: createVector(x + size, y + size),
    //         vel: createVector(Math.random() * 30 - 15, Math.random() * 30 - 15)
    //     }))
    //     temp.push(new Particle({
    //         pos: createVector(x, y + size),
    //         vel: createVector(Math.random() * 30 - 15, Math.random() * 30 - 15)
    //     }))

    //     this.edges.push(new Edge({
    //         p0: temp[0],
    //         p1: temp[1]
    //     }))
    //     this.edges.push(new Edge({
    //         p0: temp[1],
    //         p1: temp[2]
    //     }))
    //     this.edges.push(new Edge({
    //         p0: temp[2],
    //         p1: temp[3]
    //     }))
    //     this.edges.push(new Edge({
    //         p0: temp[3],
    //         p1: temp[0]
    //     }))
    //     this.edges.push(new Edge({
    //         p0: temp[0],
    //         p1: temp[2]
    //     }))

    //     this.edges.push(new Edge({
    //         p0: temp[1],
    //         p1: temp[3]
    //     }))

    //     this.pts.push(...temp);

    //     this.edges.forEach(e => {
    //         e.init();
    //     })


    //     let c = this.centroid();
    //     this.resetShape = this.pts.map(p => {
    //         return createVector(p.pos.x - c.x, p.pos.y - c.y);
    //     });
    // }
    setupResetShape() {
        let c = this.centroid();
        this.resetShape = this.pts.map(p => {
            return createVector(p.pos.x - c.x, p.pos.y - c.y);
        });
    }

    addPoint(x, y, vel) {
        let p = new Particle({
            pos: createVector(this.pos.x + x, this.pos.y + y),
            vel: vel || createVector(0, 0)
        });
        this.pts.push(p);
        return p;
    }

    addEdge(p0, p1, stiffness) {
        let e = new Edge({
            p0: p0,
            p1: p1,
            stiffness: stiffness || this.edgeStiffness
        });
        e.init();
        this.edges.push(e);
        return e;
    }

    centroid() {
        let x = 0;
        let y = 0;
        this.pts.forEach(p => {
            x += p.pos.x;
            y += p.pos.y;
        });
        return createVector(x / this.pts.length, y / this.pts.length);
    }



    shapeMatch() {
        let c = this.centroid();

        let sumCross = 0;
        let sumDot = 0;
        if (!this.lockRotation) {

            this.pts.forEach((p, i) => {
                let reset = this.resetShape[i];
                let x = p.pos.x - c.x;
                let y = p.pos.y - c.y;
                sumCross += reset.x * y - reset.y * x;
                sumDot += reset.x * x + reset.y * y;
            });

        }
        let deg = Math.atan2(sumCross, sumDot);

        let cos = Math.cos(deg);
        let sin = Math.sin(deg);

        this.pts.forEach((p, i) => {
            let reset = this.resetShape[i];
            let targetX = c.x + reset.x * cos - reset.y * sin;
            let targetY = c.y + reset.x * sin + reset.y * cos;
            p.pos.x += (targetX - p.pos.x) * this.shapeStiffness;
            p.pos.y += (targetY - p.pos.y) * this.shapeStiffness;
        });

        this.frame = { c, cos, sin };
    }



    run() {
        this.pts.forEach(p => {
                p.run();
            })
            // solving the edges several times per frame makes the body much firmer
        for (let i = 0; i < this.iterations; i++) {
            this.edges.forEach(e => {
                e.run();
            })
        }
        this.shapeMatch();
    }


    outline() {
        let n = this.outlineCount || this.pts.length;
        return this.pts.slice(0, n);
    }


    drawShape(col) {
        let n = this.outlineCount || this.pts.length;
        push();
        fill(col, 180);
        stroke(0);
        strokeWeight(2);
        strokeJoin(ROUND);
        beginShape();
        for (let i = 0; i < n; i++) {
            vertex(this.pts[i].pos.x, this.pts[i].pos.y);
        }
        endShape(CLOSE);
        pop();
    }

    draw() {
        this.edges.forEach(e => {
            e.draw();
        })
        this.pts.forEach(p => {
            p.draw();
        })

        // draw reset shape
        // push();
        // noFill();
        // stroke(255, 0, 0);
        // beginShape();
        // this.resetShape.forEach(p => {
        //     let { c, cos, sin } = this.frame;;
        //     vertex(c.x + p.x * cos - p.y * sin, c.y + p.x * sin + p.y * cos);
        // });
        // endShape(CLOSE);
        // pop();
    }

    pointInShape(p, pts) {
        let inside = false;
        for (let i = 0; i < pts.length; i++) {
            let j = (i + 1) % pts.length;
            let pi = pts[i];
            let pj = pts[j];
            if ((pi.pos.y > p.y) != (pj.pos.y > p.y) && (p.x < (pj.pos.x - pi.pos.x) * (p.y - pi.pos.y) / (pj.pos.y - pi.pos.y) + pi.pos.x)) {
                inside = !inside;
            }
        }
        return inside;
    }

    point2LineDistance(p, a, b) {
        let abX = b.pos.x - a.pos.x;
        let abY = b.pos.y - a.pos.y;
        let apX = p.x - a.pos.x;
        let apY = p.y - a.pos.y;
        let dot = abX * apX + abY * apY;
        let lenSq = abX * abX + abY * abY;
        if (lenSq == 0) return dist(p.x, p.y, a.pos.x, a.pos.y);
        let t = constrain(dot / lenSq, 0, 1);

        let closestX = a.pos.x + t * abX;
        let closestY = a.pos.y + t * abY;

        return dist(p.x, p.y, closestX, closestY);
    }

    closestPointOnLine(p, a, b) {
        let abX = b.pos.x - a.pos.x;
        let abY = b.pos.y - a.pos.y;
        let lenSq = abX * abX + abY * abY;
        let t;
        if (lenSq == 0) {
            t = 0;
        } else {
            t = constrain(((p.x - a.pos.x) * abX + (p.y - a.pos.y) * abY) / lenSq, 0, 1);
        }
        let closestX = a.pos.x + t * abX;
        let closestY = a.pos.y + t * abY;
        // return createVector(closestX, closestY);

        return { a, b, t, closestX, closestY, d: dist(p.x, p.y, closestX, closestY) };
    }

    closestEdge(p) {
        let result = null;
        let pts = this.outline();
        for (let i = 0; i < pts.length; i++) {
            let a = pts[i];
            let b = pts[(i + 1) % pts.length];

            // console.log(a.pos.x, b.pos.x)


            // let hit = createVector(this.closestPointOnLine(p, a, b).closestX, this.closestPointOnLine(p, a, b).closestY);
            // if (result == null || dist(p.x, p.y, hit.x, hit.y) < dist(p.x, p.y, result.x, result.y)) {
            //     result = hit;
            // }

            let hit = this.closestPointOnLine(p, a, b);
            // console.log(hit.d);
            if (result == null || hit.d < result.d) {
                result = hit;
            }


        }
        return result;
    }

    isPointNearShape(p, pts, threshold) {
        for (let i = 0; i < pts.length; i++) {
            let j = (i + 1) % pts.length;
            let d = this.point2LineDistance(p, pts[i], pts[j]);
            if (d < threshold) {
                return true;
            }
        }
        return false;
    }



}