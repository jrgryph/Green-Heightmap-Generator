const fs = require("fs");
const { PNG } = require("pngjs");
const { createNoise2D } = require("simplex-noise");
const alea = require("alea");

// =====================================
// SETTINGS
// =====================================

const WIDTH = 1024;
const HEIGHT = 1024;

const SEED = process.argv[2] || 12345;

const rng = alea(SEED);
const noise2D = createNoise2D(rng);

const TERRACE_LEVELS = 12;

// =====================================
// HELPERS
// =====================================

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
    return a + (b - a);
}

function smoothstep(edge0, edge1, x) {
    x = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return x * x * (3 - 2 * x);
}

// =====================================
// CREATE BLOBS
// =====================================

const blobs = [];

const blobCount = 4 + Math.floor(rng() * 5);

for (let i = 0; i < blobCount; i++) {

    blobs.push({
        x: rng() * WIDTH,
        y: rng() * HEIGHT,
        radius: 180 + rng() * 250
    });
}

console.log("Seed:", SEED);
console.log("Blobs:", blobCount);

// =====================================
// IMAGE
// =====================================

const png = new PNG({
    width: WIDTH,
    height: HEIGHT
});

console.log("Generating...");

// =====================================
// GENERATE
// =====================================

for (let y = 0; y < HEIGHT; y++) {

    for (let x = 0; x < WIDTH; x++) {

        let heightValue = 0;

        // -----------------------------
        // Blob Influence
        // -----------------------------

        for (const blob of blobs) {

            const dx = x - blob.x;
            const dy = y - blob.y;

            const dist = Math.sqrt(
                dx * dx +
                dy * dy
            );

            const influence =
                Math.max(
                    0,
                    1 - dist / blob.radius
                );

            heightValue += influence;
        }

        // Normalize

        heightValue /= 2.5;

        // -----------------------------
        // Small Noise
        // -----------------------------

        const nx = x / WIDTH;
        const ny = y / HEIGHT;

        const noise =
            noise2D(
                nx * 3,
                ny * 3
            ) * 0.08;

        heightValue += noise;

        // -----------------------------
        // Mesa / Cliff Effect
        // -----------------------------

        heightValue =
            smoothstep(
                0.15,
                0.85,
                heightValue
            );

        heightValue =
            Math.pow(
                heightValue,
                1.35
            );

        // -----------------------------
        // Terraces
        // -----------------------------

        heightValue =
            Math.floor(
                heightValue *
                TERRACE_LEVELS
            ) / TERRACE_LEVELS;

        heightValue =
            clamp(
                heightValue,
                0,
                1
            );

        // -----------------------------
        // Colors
        // -----------------------------

        let r, g, b;

        if (heightValue < 0.05) {

            r = 0;
            g = 0;
            b = 0;

        } else {

            r = Math.floor(
                40 + heightValue * 80
            );

            g = Math.floor(
                100 + heightValue * 155
            );

            b = Math.floor(
                heightValue * 25
            );

            if (heightValue > 0.85) {

                r += 20;
                g += 10;
            }
        }

        const idx =
            (y * WIDTH + x) * 4;

        png.data[idx] = clamp(r, 0, 255);
        png.data[idx + 1] = clamp(g, 0, 255);
        png.data[idx + 2] = clamp(b, 0, 255);
        png.data[idx + 3] = 255;
    }
}

// =====================================
// SAVE
// =====================================

const filename =
    `castle-story-${SEED}.png`;

png.pack()
    .pipe(
        fs.createWriteStream(
            filename
        )
    )
    .on("finish", () => {

        console.log(
            `Saved ${filename}`
        );
    });