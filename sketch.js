// global parameters
const BOUNCE = .9;
const GRAVITY = .5;
const FRICTION = .999;
const GROUND_FRICTION = .8; // sideways speed kept per frame on the floor (1 = ice, 0 = stops instantly)


let world;
let hermit; // player 1: arrow keys  (← → move, ↑ jump)
let hermit2; // player 2: Q E move, W jump

// keys currently held down (lowercase), tracked by hand so it works the same in p5 1.x and 2.x
let held = new Set();


function setup() {
    createCanvas(600, 600);

    noStroke();

    world = new World({});

    // player 1 on the left, turned to face right
    hermit = new Hermit({ pos: createVector(width * 0.3, height / 2) });
    hermit.setup();
    hermit.flip();

    // player 2 on the right, facing left (the way it's built)
    hermit2 = new Hermit({ pos: createVector(width * 0.7, height / 2) });
    hermit2.setup();

    world.hermits.push(hermit, hermit2);
}

function draw() {
    background(220);

    // player 1: left / right arrows (the crab turns to face the way it walks)
    if (keyIsDown(LEFT_ARROW)) hermit.move(-1);
    if (keyIsDown(RIGHT_ARROW)) hermit.move(1);

    // player 2: Q / E
    if (held.has('q')) hermit2.move(-1);
    if (held.has('e')) hermit2.move(1);

    world.run();
    world.draw();
}

// keyPressed fires once per press, so holding a jump key doesn't keep jumping
function keyPressed() {
    held.add(key.toLowerCase());

    // player 1 jump: up arrow
    if (key === 'ArrowUp' || keyCode === 38) {
        hermit.jump();
    }

    // player 2 jump: W
    if (key.toLowerCase() === 'w') {
        hermit2.jump();
    }
}

function keyReleased() {
    held.delete(key.toLowerCase());
}
