class World {
    constructor(args) {
        this.softBodys = args.softBodys || [];
        this.hermits = args.hermits || [];
    }

    run() {
        // this.softBodys.forEach(sb => {
        //     sb.run();
        // });



        // this.softBodys.forEach(sb => {
        //     this.softBodys.forEach(sb2 => {
        //         if (sb !== sb2) {
        //             this.resolveCollisions(sb, sb2);




        //         }
        //     })
        // });

        this.hermits.forEach(hermit => {
            hermit.softBodys.forEach(sb => {
                sb.run();
            });
            hermit.run(); // anchors: after the parts move, before collisions
        });
        this.hermits.forEach(hermit => {
            this.hermits.forEach(hermit2 => {
                if (hermit !== hermit2) {
                    hermit.softBodys.forEach(sb => {
                        hermit2.softBodys.forEach(sb2 => {
                            this.resolveCollisions(sb, sb2);
                        });
                    });
                }
            });
        });
    }

    resolveCollisions(sb, sb2) {
        sb.pts.forEach(p => {
            if (!sb2.pointInShape(p.pos, sb2.outline())) {
                return;
            }

            let { a, b, t, closestX, closestY, d } = sb2.closestEdge(p.pos);

            let newX = closestX - p.pos.x;
            let newY = closestY - p.pos.y;

            p.pos.x += newX * 0.5;
            p.pos.y += newY * 0.5;

            a.pos.x -= newX * 0.5 * (1 - t);
            a.pos.y -= newY * 0.5 * (1 - t);
            b.pos.x -= newX * 0.5 * t;
            b.pos.y -= newY * 0.5 * t;
        });



    };



    draw() {
        // this.softBodys.forEach(sb => {
        //     sb.draw();
        // });

        this.hermits.forEach(hermit => {
            hermit.draw();
        });
    }




}