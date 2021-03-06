"use strict";
// Global variables
// Settings
const densit = 0.3333;
const gridSize = 1; //Pixels (x and y, equal) per cell (square)
const imgFileName = "./images/bugs.png";
var updateRate = 8; //Maximun updates per second
// Arrays and Dictionaries
const powers = {};
const rules = {};
const colors = {};
const sprMap = {};
var elem; //Will hold all the cells
// States
const mouse = { x: null, y: null };
var clickOn = false;
// Information holders
const bugsImg = new Image();
var rows, cols;
var canvas, ctx;
var lastupdate = 0.0;
window.onload = function () {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    init();
    addEvents();
    animate();
};

function init() {
    setPowers(powers);
    setColors(colors);
    setRules(rules);
    bugsImg.src = imgFileName;
    setSpriteMap(sprMap, bugsImg, 4, 4, gridSize, gridSize);
    cols = Math.floor(window.innerWidth / gridSize);
    rows = Math.floor(window.innerHeight / gridSize);
    elem = Array.matrix(cols, rows, -1);
    fillMatrix(elem, powers, densit);
}

function animate(ts) {
    if (ts - lastupdate > 1000 / updateRate) {
        lastupdate = ts;
        interact(elem, powers, rules);
        draw(ctx, elem, sprMap);
    }
    requestAnimationFrame(animate);
}

Array.matrix = function (numcols, numrows, initial) {
    var arr = [];
    for (var i = 0; i < numrows; ++i) {
        var columns = [];
        for (var j = 0; j < numcols; ++j) {
            columns[j] = initial;
        }
        arr[i] = columns;
    }
    return arr;
};

Array.copy = function (arrFrom) {
    var arr = [];
    arrFrom.forEach((element) => {
        var thisEl = element;
        if (typeof element == "object") {
            thisEl = Array.copy(element);
        }
        arr.push(thisEl);
    });
    return arr;
};

Array.resize = function (origin_arr, to_cols, to_rows, initial) {
    var arr = Array.matrix(to_cols, to_rows, initial);
    for (var r = 0; r < to_rows; ++r) {
        if (origin_arr[r]) {
            for (var c = 0; c < to_cols; ++c) {
                arr[r][c] = origin_arr[r][c] ? origin_arr[r][c] : initial;
            }
        }
        else {
            var new_row = [];
            for (var c = 0; c < to_cols; c++) {
                new_row[c] = initial;
            }
            arr[r] = new_row;
        }
    }
    return arr;
};

function addEvents() {
    window.addEventListener("mousemove", (event) => {
        mouse.x = event.x;
        mouse.y = event.y;
    });
    window.addEventListener("click", () => {
        clickOn = !clickOn;
    });
    window.addEventListener("resize", resizeAll);
}

function resizeAll() {
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    // Todo: implement - resize the matrix, variables, etc
    let prev_rows = elem.length;
    let prev_cols = elem[0].length;
    cols = Math.floor(window.innerWidth / gridSize);
    rows = Math.floor(window.innerHeight / gridSize);
    elem = Array.resize(elem, cols, rows, -1);

}

function fillMatrix(matrix, powers, density) {
    var rows = matrix.length;
    var cols = matrix[0].length;
    var powerkeys = Object.keys(powers);
    var counter = {}
    for (var r = 0; r < rows; r += 1) {
        for (var c = 0; c < cols; c += 1) {
            if (c == 0 || c == cols - 1 || r == 0 || r == rows - 1) {
                matrix[r][c] = -1;
            } else {
                if (Math.random() < density) {
                    var randChoice = Math.floor(Math.random() * powerkeys.length);
                    counter[randChoice] = counter[randChoice] ? (counter[randChoice] + 1) : 1;
                    matrix[r][c] = powerkeys[randChoice];
                } else matrix[r][c] = -1;
            }
        }
    }
}

function interact(matrix, powers, rules) {
    var matCopy = Array.copy(matrix);
    var rows = matrix.length;
    var cols = matrix[0].length;
    var cell = Array.matrix(3, 3, -1);
    for (var r = 0; r < rows; r += 1) {
        for (var c = 0; c < cols; c += 1) {
            var v = -1;
            if (!(c == 0 || c == cols - 1 || r == 0 || r == rows - 1)) {
                cell[0][0] = matCopy[r - 1][c - 1];
                cell[0][1] = matCopy[r][c - 1];
                cell[0][2] = matCopy[r + 1][c - 1];
                cell[1][0] = matCopy[r - 1][c];
                cell[1][1] = matCopy[r][c];
                cell[1][2] = matCopy[r + 1][c];
                cell[2][0] = matCopy[r - 1][c + 1];
                cell[2][1] = matCopy[r][c + 1];
                cell[2][2] = matCopy[r + 1][c + 1];
                v = judge(cell, powers, rules);
            }
            matrix[r][c] = v;
        }
    }
}

function judge(cell, powers, rules) {
    var center = cell[1][1];
    var bugs = {};
    var winners = [];
    var maxPoints = 0;
    for (var row = 0; row < 3; row += 1) {
        for (var col = 0; col < 3; col += 1) {
            var tBug = cell[row][col];
            if (tBug !== -1) {
                if (tBug in bugs) {
                    bugs[tBug]["c"] += 1;
                } else {
                    bugs[tBug] = {
                        c: 1,
                        cond1: false,
                        points: 0,
                        cond2: false,
                    };
                }
            }
        }
    }
    var bugKeys = Object.keys(bugs);
    for (let kb = 0; kb < bugKeys.length; kb += 1) {
        let bug = bugKeys[kb];
        let points = 0;
        for (var kob = 0; kob < bugKeys.length; kob += 1) {
            var oBug = bugKeys[kob];
            if (oBug in powers[bug]["s"]) {
                points -= bugs[oBug]["c"];
            } else {
                if (oBug in powers[bug]["w"] || oBug === bug) {
                    points += bugs[oBug]["c"];
                }
            }
        }
        bugs[bug]["points"] = points;
    }
    if (center === -1) {
        for (let kb = 0; kb < bugKeys.length; kb += 1) {
            let bug = bugKeys[kb];
            if (rules["b"]["mns"] <= bugs[bug]["c"] && bugs[bug]["c"] <= rules["b"]["mxs"]) {
                bugs[bug]["cond1"] = true;
            } else bugs[bug]["cond1"] = false;
            let points = bugs[bug]["points"];

            if (rules["b"]["mnp"] <= points && points <= rules["b"]["mxp"]) {
                bugs[bug]["cond2"] = true;
            } else bugs[bug]["cond2"] = false;

            if (rules["b"]["type"] == "and") {
                if (bugs[bug]["cond1"] && bugs[bug]["cond2"]) {
                    if (points > maxPoints) {
                        winners.length = 0;
                        winners.push(bug);
                        maxPoints = points;
                    }
                    else if (points == maxPoints) {
                        winners.push(bug);
                    }
                }
            } else {
                if (rules["b"]["type"] == "or") {
                    if (bugs[bug]["cond1"] || bugs[bug]["cond2"]) {
                        if (points > maxPoints) {
                            winners.length = 0;
                            winners.push(bug);
                            maxPoints = points;
                        }
                        else if (points == maxPoints) {
                            winners.push(bug);
                        }
                    }
                }
            }
        }
    } else {
        let bug = center;
        var toLive = true;
        if (rules["d"]["mns"] <= bugs[bug]["c"] && bugs[bug]["c"] <= rules["d"]["mxs"]) {
            toLive = false;
        }
        if (toLive || rules["d"]["type"] == "and") {
            let points = bugs[bug]["points"];
            if (rules["d"]["mnp"] <= points && points <= rules["d"]["mxp"]) {
                toLive = false;
            } else toLive = true;
        }
        if (toLive) {
            if (rules["l"]["mns"] <= bugs[bug]["c"] && bugs[bug]["c"] <= rules["l"]["mxs"]) toLive = true;
            else toLive = false;
            if (toLive || rules["l"]["type"] === "or") {
                let points = bugs[bug]["points"];
                if (rules["l"]["mnp"] <= points && points <= rules["l"]["mxp"]) toLive = true;
                else toLive = false;
            }
        }
        if (toLive) winners.push(bug);
    }
    if (winners.length == 0) return -1;
    if (winners.length == 1) return winners[0];
    if (winners.length == 2) {
        if (winners[0] in powers[winners[1]]["s"]) return winners[0]
        else return winners[1];
    }
    var maxSame = 0;
    for (var i = 0; i < winners.length; i += 1) {
        if (bugs[winners[i]]["c"] > maxSame && maxSame > 0) {
            return winners[i];
        }
        maxSame = Math.max(maxSame, bugs[winners[i]]["c"]);
    }
    //console.log("****");
    //console.log(winners);
    //winners.forEach(w => {console.log(bugs[w])})
    // var randChoice = Math.floor(Math.random() * winners.length);
    // var fwinner = winners[randChoice];
    return -1;
}

function setRules(rules) {
    rules["d"] = {
        type: "or",
        mns: 0,
        mxs: 2,
        mnp: -10,
        mxp: -2,
    };
    rules["l"] = {
        type: "and",
        mns: 3,
        mxs: 4,
        mnp: -3,
        mxp: 10,
    };
    rules["b"] = {
        type: "or",
        mns: 4,
        mxs: 4,
        mnp: 3,
        mxp: 10,
    };
}

function setPowers(powers) {
    powers[0] = {
        s: [6, 7, 8, 9, 10],
        w: [1, 2, 3, 4, 5],
    };
    powers[1] = {
        s: [0, 2, 3, 4, 5],
        w: [1, 2, 3, 4, 5],
    };
    powers[2] = {
        s: [0, 3, 4, 5, 6],
        w: [1, 7, 8, 9, 10],
    };
    powers[3] = {
        s: [0, 7, 8, 9, 10],
        w: [1, 2, 4, 5, 6],
    };
    powers[4] = {
        s: [0, 3, 5, 6, 7],
        w: [1, 2, 8, 9, 10],
    };
    powers[5] = {
        s: [0, 3, 6, 7, 8],
        w: [1, 2, 4, 9, 10],
    };
    powers[6] = {
        s: [1, 3, 8, 9, 10],
        w: [0, 2, 4, 5, 7],
    };
    powers[7] = {
        s: [1, 2, 6, 9, 10],
        w: [0, 3, 4, 5, 8],
    };
    powers[8] = {
        s: [1, 2, 4, 7, 9],
        w: [0, 3, 5, 6, 10],
    };
    powers[9] = {
        s: [1, 2, 4, 5, 10],
        w: [0, 3, 6, 7, 8],
    };
    powers[10] = {
        s: [1, 2, 4, 5, 8],
        w: [0, 3, 6, 7, 9],
    };
}

function setColors(colors) {
    colors[0] = [204, 0, 0];
    colors[1] = [255, 162, 51];
    colors[2] = [231, 255, 0];
    colors[3] = [125, 255, 51];
    colors[4] = [0, 204, 37];
    colors[5] = [51, 255, 199];
    colors[6] = [0, 185, 255];
    colors[7] = [51, 88, 255];
    colors[8] = [74, 0, 204];
    colors[9] = [236, 51, 255];
    colors[10] = [255, 0, 139];
    colors[-1] = [0, 0, 0];
}
/*
function setColors2(colors) {
    colors[0] = [7, 171, 246];
    colors[1] = [0, 214, 206];
    colors[2] = [0, 229, 163];
    colors[3] = [0, 240, 124];
    colors[4] = [0, 248, 91];
    colors[5] = [0, 253, 63];
    colors[6] = [255, 0, 0];
    colors[7] = [0, 253, 21];
    colors[8] = [47, 249, 8];
    colors[9] = [128, 242, 0];
    colors[10] = [188, 231, 0];
    colors.slice(-1)[0] = [0, 0, 0];
}
*/

function setSpriteMap(sprites, bugsImg, imgCellWidth, imgCellHeigh, spriteWidth, spriteHeight) {
    for (let i = 0; i < 11; i++) {
        sprites[i] = {
            image: bugsImg,
            sx: 0,
            sy: i * imgCellHeigh,
            sWidth: imgCellWidth,
            sHeight: imgCellHeigh,
            dx: 0,
            dy: 0,
            dWidth: spriteWidth,
            dHeight: spriteHeight,
        };
    }
}

function draw(context, matrix, bugsMap) {
    let rows = matrix.length;
    let cols = matrix[0].length;

    if ("image" in bugsMap[0]) {
        // If images are to be used
        ctx.clearRect(0, 0, cols * gridSize, rows * gridSize);
        for (let r = 0; r < rows; r += 1) {
            for (let c = 0; c < cols; c += 1) {
                if (matrix[r][c] != -1) {
                    let m = bugsMap[matrix[r][c]];
                    context.drawImage(m["image"], m["sx"], m["sy"], m["sWidth"], m["sHeight"],
                        m["dx"] + c * gridSize, m["dy"] + r * gridSize, m["dWidth"], m["dHeight"]);
                }
            }
        }
    } else {
        // If a color map is to be used
        let pixelsData = new Uint8ClampedArray(cols * rows * 4);
        for (let r = 0; r < rows; r += 1) {
            for (let c = 0; c < cols; c += 1) {
                let addr = (r * cols + c) * 4;
                let cr = colors[matrix[r][c]][0];
                let cg = colors[matrix[r][c]][1];
                let cb = colors[matrix[r][c]][2];

                pixelsData[addr] = cr;
                pixelsData[addr + 1] = cg;
                pixelsData[addr + 2] = cb;
                pixelsData[addr + 3] = 255;
            }
        }

        let imageData = new ImageData(pixelsData, cols, rows);
        /*let drawing = createImageBitmap(imageData, 0, 0, cols, rows, {
            resizeWidth: cols * gridSize,
            resizeHeight: rows * gridSize,
            resizeQuality: "pixelated",
        });
        context.drawImage(drawing, 0, 0);
        */

        context.putImageData(imageData, 0, 0);
        context.drawImage(canvas, 0, 0, cols, rows, 0, 0, cols * gridSize, rows * gridSize);
    }
}
