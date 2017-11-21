
// assume 72dpi

let font_mapping = {
    cmex10: (scaled) => `400 ${scaled} Computer Modern Sans`, // XXX math
    cmmi10: (scaled) => `italic 400 ${scaled} Computer Modern Sans`, // XXX math
    cmsy5:  (scaled) => `400 ${scaled} Computer Modern Sans`, // XXX math symbols
    cmsy7:  (scaled) => `400 ${scaled} Computer Modern Sans`, // XXX math symbols
    cmsy10: (scaled) => `400 ${scaled} Computer Modern Sans`, // XXX math symbols
    cmbx10: (scaled) => `600 ${scaled} Computer Modern Serif, serif`, // XXX bold extended
    cmbx10: (scaled) => `600 ${scaled} Computer Modern Serif, serif`, // XXX bold extended
    cmbx12: (scaled) => `600 ${scaled} Computer Modern Serif, serif`, // XXX bold extended
    cmr9:   (scaled) => `400 ${scaled} Computer Modern Serif, serif`,
    cmsy9:  (scaled) => `400 ${scaled} Computer Modern Sans`, // XXX math symbols
    cmtt9:  (scaled) => `400 ${scaled} Computer Modern Serif, serif`, // XXX typewriter
    cmti9:  (scaled) => `italic 400 ${scaled} Computer Modern Serif, serif`, // XXX typewriter italic
    cmbx9:  (scaled) => `600 ${scaled} Computer Modern Serif, serif`,
    eufm10: (scaled) => `400 ${scaled} Computer Modern Serif, serif`, // XXX no clue?
    cmb10:  (scaled) => `600 ${scaled} Computer Modern Serif, serif`,
    cmti9:  (scaled) => `italic 400 ${scaled} Computer Modern Serif, serif`, // XXX typewriter italic
    cmr7:   (scaled) => `400 ${scaled} Computer Modern Serif, serif`,
    cmr10:  (scaled) => `400 ${scaled} Computer Modern Serif, serif`,
    cmmi5:  (scaled) => `italic 400 ${scaled} Computer Modern Sans`, //  XXX math italic
    cmmi7:  (scaled) => `italic 400 ${scaled} Computer Modern Sans`  //  XXX math italic
};

function loadTFMFromByteArray(font_name, tfm_data) {
}

function renderDvi(dvi, page_container) {
    let PutStr = PutStrLatin1;

    let max_h = dvi.max_h * dvi.pt_conv;
    let max_v = dvi.max_v * dvi.pt_conv;

    let aspect = max_h / max_v;

    for (let page of dvi.pages) {
	// <canvas width='800' height='1000'></canvas>
	let dvi_canvas = document.createElement("canvas");
	dvi_canvas.height = 1000;
	dvi_canvas.width = 1000 * aspect;

	console.log(`page canvas is ${dvi_canvas.width} x ${dvi_canvas.height}`);
	console.log(`page max is ${max_h} x ${max_v}`);
	console.log(`dvi coord to canvas coord scale is ${dvi_canvas.width / max_h} x ${dvi_canvas.height / max_v}`);

	page_container.appendChild(dvi_canvas);

	let ctx = dvi_canvas.getContext("2d");
	ctx.fillStyle = "#000000";

	let pos_stack = [];
	let h = 0, v = 20;
	let x = 0, y = 0, w = 0, z = 0;
	let cur_font = null;

	let pixelToCanvas = (dvipix) => dvipix / aspect;
	let canvasToPixel = (pix) => pix * aspect;

	let canvasH = () => pixelToCanvas(h);
	let canvasV = () => pixelToCanvas(v);

	function dviToPixel(v) {
	    v = dvi.byconv(v);
	    var units = v.slice(-2);
	    if (units == 'pt') {
		// we assume the browser dpi is 96, which it totally isn't
		return +v.slice(0,-2) / 72 * 96;
	    }
	    throw new Error(`unknown units ${units}`);
	}

	for (let cmd of page['content']) {
	    try {
		if (cmd[0] == POP) {
		    // why doesn't this work?
		    // { h, v, x, y, w, z } = pos_stack.pop();
		    let popped = pos_stack.pop();
		    h = popped.h;
		    v = popped.v;
		    x = popped.x;
		    y = popped.y;
		    w = popped.w;
		    z = popped.z;
		}
		else if (cmd[0] == PUSH) {
		    pos_stack.push({h, v, x, y, w, z});
		}
		else if (cmd[0] == XXX1) {
		    console.log(`xxx: ${cmd[1]}`);
		}
		else if (cmd[0] == DIR) {
		    console.log(`dir: ${cmd[1]}`);
		}
		else if (cmd[0] == BEGIN_REFLECT) {
		    console.log("begin_reflect:");
		}
		else if (cmd[0] == END_REFLECT) {
		    console.log("end_reflect:");
		}
		else if (cmd[0] == SET_RULE || cmd[0] == PUT_RULE) {
		    let a = pixelToCanvas(dviToPixel(cmd[1][0]));
		    let _b = dviToPixel(cmd[1][1]);
		    let b = pixelToCanvas(_b);

		    ctx.fillRect(canvasH(), canvasV() - a + 1, b, a);
		    console.log(`ctx.fillRect(${canvasH()}, ${canvasV() - a + 1}, ${b}, ${a});`);
		    if (cmd[0] == SET_RULE)
			h += _b;
		}
		else if (cmd[0] == SET1 || cmd[0] == PUT1) {
		    let str = PutStr(cmd[1]);
		    let font_str = font_mapping[cur_font.name](cur_font.scaled_size);
		    ctx.font = font_mapping[cur_font.name](cur_font.scaled_size);
		    if (str.indexOf('\\x') != -1)
			console.log("blah");
		    ctx.fillText(str, canvasH(), canvasV());
		    var metrics = ctx.measureText(str);
		    if (cmd[0] == SET1)
			h = canvasToPixel(canvasH() + metrics.width);
		}
		else if (cmd[0] == FNT1) {
		    try {
			cur_font = {name: dvi.font_def[cmd[1]].name, scaled_size: dvi.by_pt_conv(dvi.font_def[cmd[1]].scaled_size) };
		    }
		    catch(e) {
			console.log(cmd[1]);
			console.log(dvi.font_def.length);
			throw e;
		    }
		}
		else if (cmd[0] == GLYPHS) {
		    console.log(`setglyphs: ${dvi.DumpGlyphs(cmd[1][0], cmd[1][1])}`);
		}
		else if (cmd[0] == RIGHT1) {
		    h += +dvi.byconv(cmd[1]).slice(0,-2);
		}
		else if (cmd[0] == DOWN1) {
		    v += +dvi.byconv(cmd[1]).slice(0,-2);
		}
		else if (cmd[0] == W1) {
		    let b = +dvi.byconv(cmd[1]).slice(0,-2);
		    w = b;
		    h += b;
		}
		else if (cmd[0] == X1) {
		    let b = +dvi.byconv(cmd[1]).slice(0,-2);
		    x = b;
		    h += b;
		}
		else if (cmd[0] == Y1) {
		    let a = +dvi.byconv(cmd[1]).slice(0,-2);
		    y = a;
		    v += a;
		}
		else if (cmd[0] == Z1) {
		    let a = +dvi.byconv(cmd[1]).slice(0,-2);
		    z = a;
		    v += a;
		}
		else if (cmd[0] == W0) {
		    h += w;
		}
		else if (cmd[0] == X0) {
		    h += x;
		}
		else if (cmd[0] == Y0) {
		    v += y;
		}
		else if (cmd[0] == Z0) {
		    v += z;
		}
		else  {
		    throw new Error(`cmd[0] = ${cmd[0]}`);
		}
	    }
	    catch (e) {
		if (opNames[cmd[0]]) {
		    console.log(`failed cmd = ${opNames[cmd[0]]}`);
		}
		console.log(e);
	    }
	}
				    break;
    }
}
