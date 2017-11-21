// Global variables
let is_ptex = false;
let is_subfont = false;
let cur_font = null;
let cur_dsize = 0;
let cur_ssize = 0;
let subfont_idx = 0;
let subfont_list = ['cyberb', 'outbtm', 'outbtb', 'outgtm', 'outgtb'];

// DVI opcodes
let SET_CHAR_0 = 0,
    SET_CHAR_127 = 127,
    SET1 = 128,
    SET2 = 129,
    SET3 = 130,
    SET4 = 131,
    SET_RULE = 132,
    PUT1 = 133,
    PUT2 = 134,
    PUT3 = 135,
    PUT4 = 136,
    PUT_RULE = 137,
    NOP = 138,
    BOP = 139,
    EOP = 140,
    PUSH = 141,
    POP = 142,
    RIGHT1 = 143, RIGHT2 = 144, RIGHT3 = 145, RIGHT4 = 146,
    W0 = 147, W1 = 148, W2 = 149, W3 = 150, W4 = 151,
    X0 = 152, X1 = 153, X2 = 154, X3 = 155, X4 = 156,
    DOWN1 = 157, DOWN2 = 158, DOWN3 = 159, DOWN4 = 160,
    Y0 = 161, Y1 = 162, Y2 = 163, Y3 = 164, Y4 = 165,
    Z0 = 166, Z1 = 167, Z2 = 168, Z3 = 169, Z4 = 170,
    FNT_NUM_0 = 171, FNT_NUM_63 = 234,
    FNT1 = 235, FNT2 = 236, FNT3 = 237, FNT4 = 238,
    XXX1 = 239, XXX2 = 240, XXX3 = 241, XXX4 = 242,
    FNT_DEF1 = 243, FNT_DEF2 = 244, FNT_DEF3 = 245, FNT_DEF4 = 246,
    PRE = 247, POST = 248, POST_POST = 249,
    // DVIV opcodes
    DIR = 255,
    // DVI-IVD opcodes
    BEGIN_REFLECT = 250, END_REFLECT = 251,
    // XDV opcodes
    NATIVE_FONT_DEF = 252,
    GLYPHS = 253,
    // XDV flags
    XDV_FLAG_VERTICAL = 0x0100,
    XDV_FLAG_COLORED = 0x0200,
    XDV_FLAG_EXTEND = 0x1000,
    XDV_FLAG_SLANT = 0x2000,
    XDV_FLAG_EMBOLDEN = 0x4000,
    // DVI identifications
    DVI_ID = 2, DVIV_ID = 3, XDV_ID = 6;

let opNames = {
    [SET_CHAR_0]: "SET_CHAR_0",
    [SET_CHAR_127]: "SET_CHAR_127",
    [SET1]: "SET1",
    [SET2]: "SET2",
    [SET3]: "SET3",
    [SET4]: "SET4",
    [SET_RULE]: "SET_RULE",
    [PUT1]: "PUT1",
    [PUT2]: "PUT2",
    [PUT3]: "PUT3",
    [PUT4]: "PUT4",
    [PUT_RULE]: "PUT_RULE",
    [NOP]: "NOP", 
    [BOP]: "BOP", 
    [EOP]: "EOP", 
    [PUSH]: "PUSH",
    [POP]: "POP", 
    [RIGHT1]: "RIGHT1", 
    [RIGHT2]: "RIGHT2", 
    [RIGHT3]: "RIGHT3", 
    [RIGHT4]: "RIGHT4",
    [W0]: "W0",
    [W1]: "W1",
    [W2]: "W2",
    [W3]: "W3",
    [W4]: "W4",
    [X0]: "X0",
    [X1]: "X1",
    [X2]: "X2",
    [X3]: "X3",
    [X4]: "X4",
    [DOWN1]: "DOWN1",
    [DOWN2]: "DOWN2",
    [DOWN3]: "DOWN3",
    [DOWN4]: "DOWN4",
    [Y0]: "Y0",
    [Y1]: "Y1",
    [Y2]: "Y2",
    [Y3]: "Y3",
    [Y4]: "Y4",
    [Z0]: "Z0",
    [Z1]: "Z1",
    [Z2]: "Z2",
    [Z3]: "Z3",
    [Z4]: "Z4",
    [FNT_NUM_0]: "FNT_NUM_0",
    [FNT_NUM_63]: "FNT_NUM_63",
    [FNT1]: "FNT1",
    [FNT2]: "FNT2",
    [FNT3]: "FNT3",
    [FNT4]: "FNT4",
    [XXX1]: "XXX1",
    [XXX2]: "XXX2",
    [XXX3]: "XXX3",
    [XXX4]: "XXX4",
    [FNT_DEF1]: "FNT_DEF1",
    [FNT_DEF2]: "FNT_DEF2",
    [FNT_DEF3]: "FNT_DEF3",
    [FNT_DEF4]: "FNT_DEF4",
    [PRE]: "PRE", 
    [POST]: "POST",
    [POST_POST]: "POST_POST"
};

class BufferFP {
    constructor(buf) {
	this.buf = buf;
	this.read_head = 0;
    }
    seek(offset, whence=0) {
	if (whence == 0)
	    this.read_head = offset;
	else if (whence == 1)
	    this.read_head += offset;
	else if (whence == 2)
	    this.read_head = this.buf.length + offset;
	else
	    throw new Error("invalid whence");
    }
    tell() {
	return this.read_head;
    }
    read(n) {
	if (this.read_head + n >= this.buf.length)
	    throw new Error("read head beyond end of file");

	if (n == 1) {
	    return this.buf.readUInt8(this.read_head++);
	}
	else {
	    let rv = [];
	    for (let i = 0; i < n; i ++)
		rv.push(this.buf.readUInt8(this.read_head++));
	    return rv;
	}
    }
}

class ByteArrayFP extends BufferFP {
    read(n) {
	if (this.read_head + n >= this.buf.length)
	    throw new Error("read head beyond end of file");

	if (n == 1) {
	    return this.buf[this.read_head++];
	}
	else {
	    let rv = [];
	    for (let i = 0; i < n; i ++)
		rv.push(this.buf[this.read_head++]);
	    return rv;
	}
    }
}

function warning(msg) {
    console.error(msg);
}

function BadDVI(msg) {
    throw new Error(`Bad DVI file: ${msg}!`);
}

function GetByte(fp) { // { returns the next byte, unsigned }
    try {
	return fp.read(1);
    }
    catch (e) {
	return -1;
    }
}

function SignedByte(fp) { // { returns the next byte, signed }
    var b;
    try {
	b = fp.read(1);
    }
    catch (e) {
	return -1;
    }
    if (b < 128) return b;
    return b - 256;
}

function Get2Bytes(fp) { // { returns the next two bytes, unsigned }
    try {
	let [a, b] = fp.read(2);
	return (a << 8) + b;
    }
    catch (e) {
	BadDVI('Failed to Get2Bytes()');
    }
}

function SignedPair(fp) { // {returns the next two bytes, signed }
    try {
	let [a, b] = fp.read(2);
	if (a < 128) return (a << 8) + b;
	return ((a - 256) << 8) + b;
    }
    catch (e) {
	BadDVI('Failed to SignedPair()');
    }
}

function Get3Bytes(fp) { // { returns the next three bytes, unsigned }
    try {
	let [a, b, c] = fp.read(3);
	return (((a << 8) + b) << 8) + c;
    }
    catch (e) {
	BadDVI('Failed to Get3Bytes()');
    }
}

function SignedTrio(fp) { // { returns the next three bytes, signed }
    try {
	let [a, b, c] = fp.read(3);
	if (a < 128) return (((a << 8) + b) << 8) + c;
	return ((((a - 256) << 8) + b) << 8) + c;
    }
    catch (e) {
	BadDVI('Failed to SignedTrio()');
    }
}

function Get4Bytes(fp) { // { returns the next four bytes, unsigned }
    try {
	let [a, b, c, d] = fp.read(4);
	return (((((a << 8) + b) << 8) + c) << 8) + d;
    }
    catch (e) {
	BadDVI('Failed to Get4Bytes()');
    }
}

function SignedQuad(fp) { // { returns the next four bytes, signed }
    try {
	let [a, b, c, d] = fp.read(4);
	if (a < 128) return (((((a << 8) + b) << 8) + c) << 8) + d;
	return ((((((a - 256) << 8) + b) << 8) + c) << 8) + d;
    }
    catch (e) {
	BadDVI('Failed to get SignedQuad()');
    }
}

function PutByte(q) {
    return chr(q & 0xff);
}

function Put2Bytes(q) {
    return PutByte(q>>8) + PutByte(q);
}

function Put3Bytes(q) {
    return PutByte(q>>16) + PutByte(q>>8) + PutByte(q);
}

function PutSignedQuad(q) {
    if (q < 0) q += 0x100000000;
    return PutByte(q>>24) + PutByte(q>>16) + PutByte(q>>8) + PutByte(q);
}

function PutUnsigned(q) {
    if (q >= 0x1000000) return (3, PutSignedQuad(q));
    if (q >= 0x10000)   return (2, Put3Bytes(q));
    if (q >= 0x100)     return (1, Put2Bytes(q));
    return (0, PutByte(q));
}

function PutSigned(q) {
    if (0 <= q < 0x800000)               return PutUnsigned(q);
    if (q < -0x800000 || q >= 0x800000)  return (3, PutSignedQuad(q));
    if (q < -0x8000)     q += 0x1000000; return (2, Put3Bytes(q));
    if (q < -0x80)       q += 0x10000;   return (1, Put2Bytes(q));
    return (0, PutByte(q))
}

function PutGlyphs(width, glyphs) {
    s = [];
    length = len(glyphs);
    s.append(PutByte(GLYPHS));
    s.append(PutSignedQuad(width));
    s.append(Put2Bytes(length));
    for (let glyph of glyphs) {
	s.append(PutSignedQuad(glyph["x"]));
	s.append(PutSignedQuad(glyph["y"]));
    }
    for (let glyph of glyphs) {
	s.append(Put2Bytes(glyph["id"]));
    }
    return ''.join(s);
}

function GetInt(s) {
    try {
	return int(s);
    }
    catch (e) {
	return -1;
    }
}

function GetStrASCII(s) { // used in Parse()
    if (len(s) > 1 && ((s[0] == "'" && s[-1] == "'") || (s[0] == '"' && s[-1] == '"'))) {
	throw new Error("NYI");
	//return [ord(c) for c in s[1:-1].decode('unicode_escape')];
    }
    return '';
}

function UCS2toJIS(c) {
    s = c.encode('iso2022-jp');
    if (len(s) == 1) return ord(s);
    return (ord(s[3]) << 8) + ord(s[4]);
}

/*NOTYET
function GetStrUTF8(s) { // used in Parse()
    if (len(s) > 1 && ((s[0] == "'" && s[-1] == "'") || (s[0] == '"' && s[-1] == '"'))) {
	t = s[1:-1].decode('string_escape').decode('utf8')
	throw new Error("NYI");
	//if (is_ptex) return [UCS2toJIS(c) for c in t];
	//else         return [ord(c)       for c in t];
    }
    else {
	return '';
    }
}
*/

function PutStrASCII(t) { // unsed in Dump()
    let s = '';
    for (let o of t) {
	if (o == 92)                 s += '\\\\';
	else if (o >= 32 && o < 127) s += String.fromCharCode(o);
	else if (o < 256)            s += '\\x' + ("00" + o.toString(16)).substr(-2);
	else if (o < 65536)          s += '\\x' + ("0000" + o.toString(16)).substr(-4);
	else
	    warning(`Not support characters > 65535; may skip ${o}`);
    }
    return `${s}`;
}

function PutStrLatin1(t) { // unsed in Dump()
    let s = '';
    for (let o of t) {
	let cnv_o;
	if (o == 92)                              cnv_o = '\\\\';
	else if ((o >= 32 && o < 127) || (o >= 161 && o < 256)) cnv_o = String.fromCharCode(o);
	else if (o < 256)            cnv_o = '\\x' + ("00" + o.toString(16)).substr(-2);
	else if (o < 65536)          cnv_o = '\\x' + ("0000" + o.toString(16)).substr(-4);

	if (cnv_o)
	    s += cnv_o;
	else
	    warning(`Not support characters > 65535; may skip ${o}.`);

	if (cnv_o.indexOf('\\x') == 0)
	    console.log(`${o} = ${cnv_o}`);
    }
    return `${s}`;
}

function PutStrUTF8(t) { // unsed in Dump()
    let s = '';
    if (is_subfont) {
	for (let o of t) {
	    s += unichr((subfont_idx << 8) + o).encode('utf8');
	}
    }
    else { // not the case of subfont
	for (let o of t) {
	    if (o == 92) {
		s += '\\\\';
	    }
	    else if (o >= 32 && o < 127) {
		s += String.fromCharCode(o);
	    }
	    else if (o < 128) {
		s += '\\x' + ("00" + o.toString(16)).substr(-2);
	    }
	    else if (is_ptex) {
		s += ''.join(['\x1b$B', chr(o/256), chr(o%256)]).decode('iso2022-jp').encode('utf8');
	    }
	    else {
		s += String.fromCharCode(o); //unichr(o).encode('utf8');
	    }
	}
    }
    return `${s}`;
}

/*NOTYET
function PutStrSJIS(t) { // unsed in Dump()
  s = ''
  for o in t:
    if o == 92:         s += '\\\\'
    elif 32 <= o < 127: s += chr(o)
    elif o < 128:       s += ('\\x%02x' % o)
    else:
      s += ''.join(['\x1b$B', chr(o/256), chr(o%256)]).decode('iso2022-jp').encode('sjis')
  return "'%s'" % s
}
*/

function IsFontChanged(f, z) {
    for (let n of subfont_list) {
	if (n == f[f.length-2]) {
	    is_subfont = true;
	    subfont_idx = f.slice(-2);
	    if (cur_font == n && cur_ssize == z) {
		return false;
	    }
	    else {
		cur_font = n;
		cur_ssize = z;
		return true;
	    }
	}
    }
    is_subfont = false;
    cur_font = f;
    cur_ssize = z;
    return true;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DVI class
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class DVI {
    constructor(unit='pt') {
	if   (unit == 'sp')    this.byconv = this.by_sp_conv;
	else if (unit == 'bp') this.byconv = this.by_bp_conv;
	else if (unit == 'mm') this.byconv = this.by_mm_conv;
	else if (unit == 'cm') this.byconv = this.by_cm_conv;
	else if (unit == 'in') this.byconv = this.by_in_conv;
	else                   this.byconv = this.by_pt_conv;
	this.Initialize();
    }

    //////////////////////////////////////////////////////////
    // Initialize: Required by __init__(), Load(), and Parse()
    //////////////////////////////////////////////////////////
    Initialize() {
	this.id = DVI_ID;
	this.numerator   = 25400000;
	this.denominator = 473628672;
	this.mag = 1000;
	this.ComputeConversionFactors();
	this.comment = '';
	this.font_def = [];
	this.max_v = this.max_h = this.max_s = this.total_pages = 0;
	this.pages = [];
    }

    //////////////////////////////////////////////////////////
    // Load: DVI -> Internal Format
    //////////////////////////////////////////////////////////
    static Load(fn, unit="pt") {
	try {
	    var fs = require('fs');
	    let buffer = fs.readFileSync(fn);
	    if (buffer.readUInt8(0) != PRE) return null;
	    if (buffer.readUInt8(buffer.length-4) != 223) return null; // 223?

	    let aDVI = new DVI(unit);
	    aDVI.LoadFromFile(new BufferFP(buffer));
	    return aDVI;
	}
	catch (e) {
	    console.error('Failed to read ' + fn);
	    console.log(e);
	    console.log(e.stack);
	    return null;
	}
    }

    static LoadFromByteArray(buffer, unit="pt") {
	if (!IsDVI(buffer))
	    return null;

	let aDVI = new DVI(unit);
	aDVI.LoadFromFile(new ByteArrayFP(buffer));
	return aDVI;
    }

    LoadFromFile(fp) {
	this.Initialize();
	fp.seek(0, 2);
	if (fp.tell() < 53) BadDVI('less than 53 bytes long');
	this.ProcessPreamble(fp);
	this.ProcessPostamble(fp);
	let loc = this.first_backpointer;
	while (loc >= 0) {
	    fp.seek(loc);
	    if (GetByte(fp) != BOP) BadDVI('byte %d is not bop' % fp.tell());
	    let cnt = [];
	    for (let i = 0; i < 10; i ++)
		cnt.push(SignedQuad(fp));
	    loc = SignedQuad(fp);
	    let page = this.ProcessPage(fp);
	    this.pages.unshift({count:cnt, content:page});
	}
	//this._dumpPageContent(this.pages[0].content);
    }

    _dumpPageContent(content) {
	for (let c of content) {
	    console.log(`[${opNames[c[0]]} ${c.slice(1)}]`);
	}
    }

    ProcessPreamble(fp) {
	fp.seek(0);
	if (GetByte(fp) != PRE) BadDVI("First byte isn't start of preamble");
	let id = GetByte(fp);
	if (id != DVI_ID && id != DVIV_ID && id != XDV_ID) {
	    warning("ID byte is %d; use the default %d!" % (id, DVI_ID));
	}
	else {
	    this.id = id;
	}
	let numerator = SignedQuad(fp);
	if (numerator <= 0) {
	    warning('numerator is %d; use the default 25400000!' % numerator);
	}
	else {
	    this.numerator = numerator;
	}
	let denominator = SignedQuad(fp);
	if (denominator <= 0) {
	    warning('denominator is %d; use the default 473628672!' % denominator);
	}
	else {
	    this.denominator = denominator;
	}
	let mag = SignedQuad(fp);
	if (mag <= 0) {
	    warning('magnification is %d; use the default 1000!' % mag);
	}
	else {
	    this.mag = mag;
	}
	this.comment = fp.read(GetByte(fp)).map((x) => String.fromCharCode(x)).join('');
	this.ComputeConversionFactors();
    }

    ProcessPostamble(fp) {
	fp.seek(-5, 2); // at least four 223's
	let k;
	while (true) {
	    k = GetByte(fp);
	    if      (k < 0)    BadDVI('all 223s; is it a DVI file?'); // found EOF
	    else if (k != 223) break;
	    fp.seek(-2, 1);
	}
	if (k != DVI_ID && k != DVIV_ID && k != XDV_ID) {
	    warning(`ID byte is ${k}`);
	}
	fp.seek(-5, 1);
	let q = SignedQuad(fp);
	let m = fp.tell(); // id_byte
	if (q < 0 || q > m - 33) BadDVI(`post pointer ${q} at byte ${m -4}`);
	fp.seek(q); // move to post
	k = GetByte(fp);
	if (k != POST) BadDVI('byte %d is not post' % k);
	this.post_loc = q;
	this.first_backpointer = SignedQuad(fp);

	if (SignedQuad(fp) != this.numerator) {
	    warning("numerator doesn't match the preamble!");
	}
	if (SignedQuad(fp) != this.denominator) {
	    warning("denominator doesn't match the preamble!");
	}
	if (SignedQuad(fp) != this.mag) {
	    warning("magnification doesn't match the preamble!");
	}
	this.max_v = SignedQuad(fp);
	this.max_h = SignedQuad(fp);
	this.max_s = Get2Bytes(fp);
	this.total_pages = Get2Bytes(fp);
	while (true) {
	    let p;
	    k = GetByte(fp);
	    if (k == FNT_DEF1)
		this.DefineFont(GetByte(fp), fp);
	    else if (k == FNT_DEF2)
		this.DefineFont(Get2Bytes(fp), fp);
	    else if (k == FNT_DEF3)
		this.DefineFont(Get3Bytes(fp), fp);
	    else if (k == FNT_DEF4)
		this.DefineFont(SignedQuad(fp), fp);
	    else if (k == NATIVE_FONT_DEF)
		this.DefineNativeFont(SignedQuad(fp), fp);
	    else if (k != NOP)
		break;
	}
	if (k != POST_POST) {
	    warning(`byte ${fp.tell() - 1} is not postpost!`);
	}
	if (SignedQuad(fp) != this.post_loc) {
	    warning(`bad postamble pointer in byte ${fp.tell() - 4}!`);
	}
	m = GetByte(fp);
	if (m != DVI_ID && m != DVIV_ID && m != XDV_ID) {
	    warning(`identification in byte ${fp.tell() - 1} should be ${DVI_ID}, ${DVIV_ID}, or ${XDV_ID}!`);
	}
    }

    DefineFont(e, fp) {
	let c = SignedQuad(fp); // font_check_sum
	let q = SignedQuad(fp); // font_scaled_size
	let d = SignedQuad(fp); // font_design_size
	let n = fp.read(GetByte(fp) + GetByte(fp)).map((x) => String.fromCharCode(x)).join('');
	let f;

	f = this.font_def[e];
	if (!f) {
	    this.font_def[e] = {'name':n, 'checksum':c, 'scaled_size':q, 'design_size':d};
	    if (q <= 0 /*NOTYET || q >= 01000000000 */) {
		warning(`${n}---not loaded, bad scale (${q})!`);
	    }
	    else if (d <= 0 /*NOTYET || d >= 01000000000 */) {
		warning(`${n}---not loaded, bad design size (${d})!`);
	    }
	}
	else {
	    if (f['checksum'] != c) {
		warning("\t---check sum doesn't match previous definition!");
	    }
	    if (f['scaled_size'] != q) {
		warning("\t---scaled size doesn't match previous definition!");
	    }
	    if (f['design_size'] != d) {
		warning("\t---design size doesn't match previous definition!");
	    }
	    if (f['name'] != n) {
		warning("\t---font name doesn't match previous definition!");
	    }
	}
    }

    DefineNativeFont(e, fp) {
	let size = Get4Bytes(fp); // scaled size
	let flags = Get2Bytes(fp);
	let l = GetByte(fp); // name length
	let fnt_name = fp.read(l);
	let index = Get4Bytes(fp); // face index
	let ext = [];
	let embolden = 0;
	if (flags & XDV_FLAG_VERTICAL) ext.append("vertical");
	if (flags & XDV_FLAG_COLORED) ext.append("color=%08X" % Get4Bytes(fp));
	if (flags & XDV_FLAG_EXTEND) ext.append("extend=%d" % SignedQuad(fp));
	if (flags & XDV_FLAG_SLANT) ext.append("slant=%d" % SignedQuad(fp));
	if (flags & XDV_FLAG_EMBOLDEN) ext.append("embolden=%d" % SignedQuad(fp));
	let f;
	try {
	    f = this.font_def[e];
	}
	catch (exc) {
	    if (index > 0) {
		fnt_name += "[%d]" % index;
	    }
	    let name = '"%s"' % fnt_name;
	    if (ext) {
		name = '"%s:%s"' % (fnt_name, ";".join(ext));
	    }

	    this.font_def[e] = {
		'name': name,
		'checksum': 0,
		'scaled_size': size,
		'design_size': 655360, // hardcoded
            };
	}
    }

    ProcessPage(fp) {
	let s = [];
	while (true) {
	    let o = GetByte(fp);
	    let p = this.Get1Arg(o, fp);
	    let q;
	    if (o < (SET_CHAR_0 + 128) || [SET1, SET2, SET3, SET4].indexOf(o) != -1) {
		let q = [p];
/*
		while (true) {
		    o = GetByte(fp);
		    p = this.Get1Arg(o, fp);
		    if (o < (SET_CHAR_0 + 128) || [SET1, SET2, SET3, SET4].indexOf(o) != -1) {
			q.push(p);
		    }
		    else {
			break;
		    }
		}
*/
		s.push([SET1, q]);
	    }
	    if (o == SET_RULE) {
		s.push([SET_RULE, [p, SignedQuad(fp)]]);
	    }
	    else if ([PUT1, PUT2, PUT3, PUT4].indexOf(o) != -1) {
		s.push([PUT1, p]);
	    }
	    else if (o == PUT_RULE) {
		s.push([PUT_RULE, [p, SignedQuad(fp)]]);
	    }
	    else if (o == NOP) {
		continue;
	    }
	    else if (o == BOP) {
		warning('bop occurred before eop!');
		break;
	    }
	    else if (o == EOP) {
		break;
	    }
	    else if (o == PUSH) {
		s.push([PUSH]);
	    }
	    else if (o == POP) {
		s.push([POP]);
	    }
	    else if ([RIGHT1, RIGHT2, RIGHT3, RIGHT4].indexOf(o) != -1) {
		s.push([RIGHT1, p]);
	    }
	    else if (o == W0) {
		s.push([W0]);
	    }
	    else if ([W1, W2, W3, W4].indexOf(o) != -1) {
		s.push([W1, p]);
	    }
	    else if (o == X0) {
		s.push([X0]);
	    }
	    else if ([X1, X2, X3, X4].indexOf(o) != -1) {
		s.push([X1, p]);
	    }
	    else if ([DOWN1, DOWN2, DOWN3, DOWN4].indexOf(o) != -1) {
		s.push([DOWN1, p]);
	    }
	    else if (o == Y0) {
		s.push([Y0]);
	    }
	    else if ([Y1, Y2, Y3, Y4].indexOf(o) != -1) {
		s.push([Y1, p]);
	    }
	    else if (o == Z0) {
		s.push([Z0]);
	    }
	    else if ([Z1, Z2, Z3, Z4].indexOf(o) != -1) {
		s.push([Z1, p]);
	    }
	    else if (o < FNT_NUM_0 + 64 || [FNT1, FNT2, FNT3, FNT4].indexOf(o) != -1) {
		s.push([FNT1, p]);
	    }
	    else if ([XXX1, XXX2, XXX3, XXX4].indexOf(o) != -1) {
		q = fp.read(p);
		s.push([XXX1, q]);
	    }
	    else if ([FNT_DEF1, FNT_DEF2, FNT_DEF3, FNT_DEF4].indexOf(o) != -1) {
		this.DefineFont(p, fp);
	    }
	    else if (o == NATIVE_FONT_DEF) {
		this.DefineNativeFont(p, fp);
	    }
	    else if (o == GLYPHS) {
		s.push([GLYPHS, this.GetGlyphs(fp)]);
	    }
	    else if (o == DIR) {
		s.push([DIR, p]);
	    }
	    else if (o == BEGIN_REFLECT) {
		s.push([BEGIN_REFLECT]);
	    }
	    else if (o == END_REFLECT) {
		s.push([END_REFLECT]);
	    }
	    else if (o == PRE) {
		warning('preamble command within a page!');
		break;
	    }
	    else if ([POST, POST_POST].indexOf(o) != -1) {
		warning(`postamble command ${o}!`);
		break;
	    }
	    else {
		warning(`undefined command ${o}!`);
		break;
	    }
	}
	return s;
    }

      Get1Arg(o, fp) {
	  if (o < SET_CHAR_0 + 128) {
	      return o - SET_CHAR_0;
	  }
	  let is_1byte_op = (op) => [SET1, PUT1, FNT1, XXX1, FNT_DEF1, DIR].indexOf(op) != -1;
	  let is_2byte_op = (op) => [SET2, PUT2, FNT2, XXX2, FNT_DEF2].indexOf(op) != -1;
	  let is_3byte_op = (op) => [SET3, PUT3, FNT3, XXX3, FNT_DEF3].indexOf(op) != -1;
	  let is_s1byte_op = (op) => [RIGHT1, W1, X1, DOWN1, Y1, Z1].indexOf(op) != -1;
	  let is_s2byte_op = (op) => [RIGHT2, W2, X2, DOWN2, Y2, Z2].indexOf(op) != -1;
	  let is_s3byte_op = (op) => [RIGHT3, W3, X3, DOWN3, Y3, Z3].indexOf(op) != -1;
	  let is_s4byte_op = (op) => [SET4, SET_RULE, PUT4, PUT_RULE, RIGHT4, W4, X4, DOWN4, Y4, Z4, FNT4, XXX4, FNT_DEF4, NATIVE_FONT_DEF].indexOf(op) != -1;
	  let is_0byte_op = (op) => [NOP, BOP, EOP, PUSH, POP, PRE, POST, POST_POST, W0, X0, Y0, Z0, BEGIN_REFLECT, END_REFLECT].indexOf(op) != -1;

	  if (is_1byte_op(o)) {
	      return GetByte(fp);
	  }
	  if (is_2byte_op(o)) {
	      return Get2Bytes(fp);
	  }
	  if (is_3byte_op(o)) {
	      return Get3Bytes(fp);
	  }
	  if (is_s1byte_op(o)) {
	      return SignedByte(fp);
	  }
	  if (is_s2byte_op(o)) {
	      return SignedPair(fp);
	  }
	  if (is_s3byte_op(o)) {
	      return SignedTrio(fp);
	  }
	  if (is_s4byte_op(o)) {
	      return SignedQuad(fp);
	  }
	  if (is_0byte_op(o) || o > POST_POST) {
	      return 0;
	  }
	  if (o < FNT_NUM_0 + 64) {
	      return o - FNT_NUM_0;
	  }
	  throw new Error();
      }

      GetGlyphs(fp) {
	  width = SignedQuad(fp)
	  length = Get2Bytes(fp)
	  glyphs = {}
	  for (i in range(length)) {
	      glyphs[i] = {}
	      glyphs[i]["x"] = SignedQuad(fp)
	      glyphs[i]["y"] = SignedQuad(fp)
	  }
	  for (i in range(length)) {
	      glyphs[i]["id"] = Get2Bytes(fp)
	  }

	  return (width, glyphs)
      }

      ReadGlyphs(val) {
	  glyphs = []
	  w, g = val.split(" ", 1)
	  throw new Error("2");
	  /*
	  for (let m of re.finditer(r"gid(?P<id>\d+?)\((?P<pos>.*?.)\)", g)) {
	      gid = m.group("id")
	      pos = m.group("pos")

	      if ("," in pos) {
		  x, y = pos.split(",")
	      }
	      else {
		  x, y = pos, "0sp"
	      }

	      glyphs.append({"id": int(gid), 'x': this.ConvLen(x), 'y': this.ConvLen(y)})
	  }

	  return (this.ConvLen(w), glyphs)
*/
      }
/*
      //////////////////////////////////////////////////////////
      // Save: Internal Format -> DVI
      //////////////////////////////////////////////////////////
  def Save(self, fn):
    fp = file(fn, 'wb')
    this.SaveToFile(fp)
    fp.close()

  def SaveToFile(self, fp):
    // WritePreamble
    fp.write(''.join([chr(PRE), PutByte(this.id), PutSignedQuad(this.numerator), PutSignedQuad(this.denominator), PutSignedQuad(this.mag), PutByte(len(this.comment)), this.comment]))
    // WriteFontDefinitions
    this.WriteFontDefinitions(fp)
    // WritePages
    stackdepth = 0; loc = -1
    for page in this.pages:
      w = x = y = z = 0; stack = []
      s = [chr(BOP)]
      s.extend([PutSignedQuad(c) for c in page['count']])
      s.append(PutSignedQuad(loc))
      for cmd in page['content']:
        if cmd[0] == SET1:
          for o in cmd[1]:
            if o < 128: s.append(chr(SET_CHAR_0 + o))
            else:       s.append(this.CmdPair([SET1, o]))
        else if cmd[0] in (SET_RULE, PUT_RULE):
          s.append(chr(cmd[0]) + PutSignedQuad(cmd[1][0]) + PutSignedQuad(cmd[1][1]))
        else if cmd[0] == PUT1:
          s.append(this.CmdPair([PUT1, cmd[1][0]]))
        else if cmd[0] in (RIGHT1, DOWN1):
          s.append(this.CmdPair(cmd))
        else if cmd[0] in (W0, X0, Y0, Z0):
          s.append(chr(cmd[0]))
        else if cmd[0] == PUSH:
          s.append(chr(PUSH))
          stack.append((w, x, y, z))
          if len(stack) > stackdepth: stackdepth = len(stack)
        else if cmd[0] == POP:
          s.append(chr(POP))
          w, x, y, z = stack.pop()
        else if cmd[0] == W1:
          w = cmd[1]; s.append(this.CmdPair(cmd))
        else if cmd[0] == X1:
          x = cmd[1]; s.append(this.CmdPair(cmd))
        else if cmd[0] == Y1:
          y = cmd[1]; s.append(this.CmdPair(cmd))
        else if cmd[0] == Z1:
          z = cmd[1]; s.append(this.CmdPair(cmd))
        else if cmd[0] == FNT1:
          if cmd[1] < 64: s.append(chr(FNT_NUM_0 + cmd[1]))
          else:           s.append(this.CmdPair(cmd))
        else if cmd[0] == XXX1:
          l = len(cmd[1])
          if l < 256: s.append(chr(XXX1) + chr(l) + cmd[1])
          else:       s.append(chr(XXX4) + PutSignedQuad(l) + cmd[1])
        else if cmd[0] == DIR:
          s.append(chr(DIR) + chr(cmd[1]))
        else if cmd[0] == BEGIN_REFLECT:
          s.append(chr(BEGIN_REFLECT))
        else if cmd[0] == END_REFLECT:
          s.append(chr(END_REFLECT))
        else if cmd[0] == GLYPHS:
          s.append(PutGlyphs(cmd[1], cmd[2]))
        else:
          warning('invalid command %s!' % cmd[0])
      s.append(chr(EOP))
      loc = fp.tell()
      fp.write(''.join(s))
    // WritePostamble
    post_loc = fp.tell()
    fp.write(''.join([chr(POST), PutSignedQuad(loc), PutSignedQuad(this.numerator), PutSignedQuad(this.denominator), PutSignedQuad(this.mag), PutSignedQuad(this.max_v), PutSignedQuad(this.max_h), Put2Bytes(stackdepth+1), Put2Bytes(len(this.pages))]))
    // WriteFontDefinitions
    this.WriteFontDefinitions(fp)
    // WritePostPostamble
    fp.write(''.join([chr(POST_POST), PutSignedQuad(post_loc), PutByte(this.id), '\xdf\xdf\xdf\xdf']))
    loc = fp.tell()
    while (loc % 4) != 0:
      fp.write('\xdf'); loc += 1

  def WriteFontDefinitions(self, fp):
    s = []
    for e in sorted(this.font_def.keys()):
      if this.font_def[e]['native']:
        flags = this.font_def[e]['flags']
        s.append(PutByte(NATIVE_FONT_DEF))
        s.append(PutSignedQuad(e))
        s.append(PutSignedQuad(this.font_def[e]['scaled_size']))
        s.append(Put2Bytes(flags))
        s.append(PutByte(len(this.font_def[e]['name'])))
        s.append(this.font_def[e]['name'])
        s.append(PutSignedQuad(this.font_def[e]['index']))
        print >> sys.stderr, this.font_def[e]['name'], this.font_def[e]['index']
        if flags & XDV_FLAG_COLORED: s.append(PutSignedQuad(this.font_def[e]['color']))
        if flags & XDV_FLAG_EXTEND: s.append(PutSignedQuad(this.font_def[e]['extend']))
        if flags & XDV_FLAG_SLANT: s.append(PutSignedQuad(this.font_def[e]['slant']))
        if flags & XDV_FLAG_EMBOLDEN: s.append(PutSignedQuad(this.font_def[e]['embolden']))
      else:
        l, q = PutUnsigned(e)
        s.append(PutByte(FNT_DEF1 + l))
        s.append(q)
        s.append(PutSignedQuad(this.font_def[e]['checksum']))
        s.append(PutSignedQuad(this.font_def[e]['scaled_size']))
        s.append(PutSignedQuad(this.font_def[e]['design_size']))
        s.append('\x00')
        s.append(PutByte(len(this.font_def[e]['name'])))
        s.append(this.font_def[e]['name'])
    fp.write(''.join(s))

  def CmdPair(self, cmd):
    l, q = PutSigned(cmd[1])
    return chr(cmd[0] + l) + q
*/

/*
  //////////////////////////////////////////////////////////
  // Parse: Text -> Internal Format
  //////////////////////////////////////////////////////////
  def Parse(self, fn, encoding=''):
    fp = file(fn, 'r')
    s = fp.read()
    fp.close()
    this.ParseFromString(s, encoding=encoding)

  def ParseFromString(self, s, encoding=''):
    global GetStr, cur_font, cur_dsize, cur_ssize, subfont_idx
    if encoding == 'ascii': GetStr = GetStrASCII
    else:                   GetStr = GetStrUTF8
    this.Initialize()
    this.fnt_num = 0
    for l in s.split('\n'):
      l = l.strip()
      if not l || l[0] == '%': continue
      try:
        key, val = l.split(':', 1)
        key = key.strip(); val = val.strip()
      except:
        if l[-1] == ']': v = l[:-1].split(' ')
        else: v = l.split(' ')
        if v[0] == "[page":
          this.cur_page = []
          count = [GetInt(c) for c in v[1:]]
          if len(count) < 10: count += ([0] * (10-len(count)))
          this.pages.append({'count':count, 'content':this.cur_page})
        continue
      // ParsePreamble
      if key == "id":
        this.id = GetInt(val)
        if this.id != DVI_ID && this.id != DVIV_ID && this.id != XDV_ID:
          warning("identification byte should be %d, %d, or %d!" % (DVI_ID, DVIV_ID, XDV_ID))
      else if key == "numerator":
        d = GetInt(val)
        if d <= 0:
          warning('non-positive numerator %d!' % d)
        else:
          this.numerator = d
          this.ComputeConversionFactors()
      else if key == "denominator":
        d = GetInt(val)
        if d <= 0:
          warning('non-positive denominator %d!' % d)
        else:
          this.denominator = d
          this.ComputeConversionFactors()
      else if key == "magnification":
        d = GetInt(val)
        if d <= 0:
          warning('non-positive magnification %d!' % d)
        else:
          this.mag = d
      else if key == "comment":
        this.comment = val[1:-1]
      // Parse Postamble
      else if key == "maxv":
        this.max_v = this.ConvLen(val)
      else if key == "maxh":
        this.max_h = this.ConvLen(val)
      else if key == "maxs":
        this.max_s = GetInt(val)
      else if key == "pages":
        this.total_pages = GetInt(val)
      // Parse Font Definitions
      else if key == "fntdef":
        this.font_def[this.fnt_num] = this.GetFntDef(val)
        this.fnt_num += 1
      // Parse Pages
      else if key == 'xxx':
        this.cur_page.append([XXX1, eval(val)])
      else if key == 'set':
        ol = GetStr(val)
        if is_subfont:
          subfont_idx = (ol[0] >> 8)
          this.AppendFNT1()
          nl = [ol[0] & 0xff]
          for o in ol[1:]:
            idx = (o >> 8)
            if idx != subfont_idx:
              this.cur_page.append([SET1, nl])
              subfont_idx = idx
              this.AppendFNT1()
              nl = [o & 0xff]
            else:
              nl.append(o & 0xff)
          this.cur_page.append([SET1, nl])
        else:
          this.cur_page.append([SET1, ol])
      else if key == 'put':
        this.cur_page.append([PUT1, GetStr(val)])
      else if key == 'setrule':
        v = val.split(' ')
        if len(v) != 2:
          warning('two values are required for setrule!')
          continue
        this.cur_page.append([SET_RULE, [this.ConvLen(c) for c in v]])
      else if key == 'putrule':
        v = val.split(' ')
        if len(v) != 2:
          warning('two values are required for putrule!')
          continue
        this.cur_page.append([PUT_RULE, [this.ConvLen(c) for c in v]])
      else if key == 'fnt':
        f = this.GetFntDef(val)
        n = f['name']
        d = f['design_size']
        q = f['scaled_size']
        if n in subfont_list:
          is_subfont = true
          cur_font = n; cur_dsize = d; cur_ssize = q
        else:
          is_subfont = false
          try:
            e = this.font_def.keys()[this.font_def.values().index(f)]
          except:
            e = this.fnt_num
            this.font_def[this.fnt_num] = f
            this.fnt_num += 1
          this.cur_page.append([FNT1, e])
      else if key == 'right':
        this.cur_page.append([RIGHT1, this.ConvLen(val)])
      else if key == 'down':
        this.cur_page.append([DOWN1, this.ConvLen(val)])
      else if key == 'w':
        this.cur_page.append([W1, this.ConvLen(val)])
      else if key == 'x':
        this.cur_page.append([X1, this.ConvLen(val)])
      else if key == 'y':
        this.cur_page.append([Y1, this.ConvLen(val)])
      else if key == 'z':
        this.cur_page.append([Z1, this.ConvLen(val)])
      else if key == 'push':
        this.cur_page.append([PUSH])
      else if key == 'pop':
        this.cur_page.append([POP])
      else if key == 'w0':
        this.cur_page.append([W0])
      else if key == 'x0':
        this.cur_page.append([X0])
      else if key == 'y0':
        this.cur_page.append([Y0])
      else if key == 'z0':
        this.cur_page.append([Z0])
      else if key == 'dir':
        this.cur_page.append([DIR, GetInt(val)])
      else if key == 'begin_reflect':
        this.cur_page.append([BEGIN_REFLECT])
      else if key == 'end_reflect':
        this.cur_page.append([END_REFLECT])
      else if key == 'setglyphs':
        w, glyphs = this.ReadGlyphs(val)
        this.cur_page.append([GLYPHS, w, glyphs])
      else:
        warning('invalid command %s!' % key)

  def AppendFNT1(self):
    f = {'name':cur_font+"%02x"%subfont_idx, 'design_size':cur_dsize, 'scaled_size':cur_ssize, 'checksum':0}
    try:
      e = this.font_def.keys()[this.font_def.values().index(f)]
    except:
      e = this.fnt_num
      this.font_def[e] = f
      this.fnt_num += 1
    this.cur_page.append([FNT1, e])
*/

    //////////////////////////////////////////////////////////
    // Dump: Internal Format -> Text
    //////////////////////////////////////////////////////////
    Dump(fn, tabsize=2, encoding='') {
	fp = file(fn, 'w');
	this.DumpToFile(fp, tabsize=tabsize, encoding=encoding);
	fp.close();
    }

    DumpToFile(fp, tabsize=2, encoding='') {
	let PutStr;
	if      (encoding == 'ascii')     PutStr = PutStrASCII;
	else if (encoding == 'latin1') PutStr = PutStrLatin1;
	else if (encoding == 'sjis')   PutStr = PutStrSJIS;
	else                           PutStr = PutStrUTF8;
	// DumpPreamble
	fp.write("[preamble]\n");
	fp.write(`id: ${this.id}\n`);
	fp.write(`numerator: ${this.numerator}\n`);
	fp.write(`denominator: ${this.denominator}\n`);
	fp.write(`magnification: ${this.mag}\n`);
	fp.write(`comment: ${this.comment}\n`);
	// DumpPostamble
	fp.write("\n[postamble]\n");
	fp.write(`maxv: ${this.byconv(this.max_v)}\n`);
	fp.write(`maxh: ${this.byconv(this.max_h)}\n`);
	fp.write(`maxs: ${this.max_s}\n`);
	fp.write(`pages: ${this.total_pages}\n`);
	// DumpFontDefinitions
	fp.write("\n[font definitions]\n");
	for (let e of Object.getOwnPropertyNames(this.font_def).sort()) {
	    fp.write(`fntdef: ${this.font_def[e]['name']}`);
	    if (this.font_def[e]['design_size'] != this.font_def[e]['scaled_size']) {
		fp.write(` (${this.by_pt_conv(this.font_def[e]['design_size'])}) `);
	    }
	    fp.write(` at ${this.by_pt_conv(this.font_def[e]['scaled_size'])}\n`);
	}
	// DumpPages
	for (let page of this.pages) {
	    fp.write("\n[page " + page['count'] + "]\n");
	    let indent = 0;
	    for (let cmd of page['content']) {
	      try {
		if (cmd[0] == POP) {
		    indent -= tabsize;
		    for (let i = 0; i < indent; i ++)
			fp.write(' ');
		    fp.write("pop:\n");
		    continue;
		}
		for (let i = 0; i < indent; i ++)
		    fp.write(' ');
		if (cmd[0] == PUSH) {
		    fp.write("push:\n");
		    indent += tabsize;
		}
		else if (cmd[0] == XXX1) {
		    fp.write(`xxx: ${cmd[1]}\n`);
		}
		else if (cmd[0] == DIR) {
		    fp.write(`dir: ${cmd[1]}\n`);
		}
		else if (cmd[0] == BEGIN_REFLECT) {
		    fp.write("begin_reflect:\n");
		}
		else if (cmd[0] == END_REFLECT) {
		    fp.write("end_reflect:\n");
		}
		else if (cmd[0] == SET_RULE) {
		    fp.write(`setrule: ${this.byconv(cmd[1][0])} ${this.byconv(cmd[1][1])}\n`);
		}
		else if (cmd[0] == PUT_RULE) {
		    fp.write(`putrule: ${this.byconv(cmd[1][0])} ${this.byconv(cmd[1][1])}\n`);
		}
		else if (cmd[0] == SET1) {
		    fp.write(`set: ${PutStr(cmd[1])}\n`);
		}
		else if (cmd[0] == PUT1) {
		    fp.write(`put: ${PutStr(cmd[1])}\n`);
		}
		else if (cmd[0] == FNT1) {
		    let f = this.font_def[cmd[1]].name;
		    let z = this.font_def[cmd[1]].scaled_size;
		    if (IsFontChanged(f, z)) {
			fp.write(`fnt: ${cur_font} `);
			if (this.font_def[cmd[1]].design_size != this.font_def[cmd[1]].scaled_size) {
			    fp.write(`(${this.by_pt_conv(this.font_def[cmd[1]].design_size)}) `);
			}
			fp.write(`at ${this.by_pt_conv(cur_ssize)}\n`);
		    }
		}
		else if (cmd[0] == GLYPHS) {
		    fp.write(`setglyphs: ${this.DumpGlyphs(cmd[1][0], cmd[1][1])}\n`);
		}
		else if (cmd[0] == RIGHT1) {
		    fp.write(`right: ${this.byconv(cmd[1])}\n`);
		}
		else if (cmd[0] == DOWN1) {
		    fp.write(`down: ${this.byconv(cmd[1])}\n`);
		}
		else if (cmd[0] == W1) {
		    fp.write(`w: ${this.byconv(cmd[1])}\n`);
		}
		else if (cmd[0] == X1) {
		    fp.write(`x: ${this.byconv(cmd[1])}\n`);
		}
		else if (cmd[0] == Y1) {
		    fp.write(`y: ${this.byconv(cmd[1])}\n`);
		}
		else if (cmd[0] == Z1) {
		    fp.write(`z: ${this.byconv(cmd[1])}\n`);
		}
		else if (cmd[0] == W0) {
		    fp.write("w0:\n");
		}
		else if (cmd[0] == X0) {
		    fp.write("x0:\n");
		}
		else if (cmd[0] == Y0) {
		    fp.write("y0:\n");
		}
		else if (cmd[0] == Z0) {
		    fp.write("z0:\n");
		}
		else  {
		    throw new Error(`cmd[0] = ${cmd[0]}`);
		}
	      }
	      catch (e) {
		  console.log(`failed cmd = ${cmd}`);
	      }
	    }
	}
    }

    DumpHTMLHack(fp, tabsize=2, encoding='') {
	let PutStr;
	if      (encoding == 'ascii')     PutStr = PutStrASCII;
	else if (encoding == 'latin1') PutStr = PutStrLatin1;
	else if (encoding == 'sjis')   PutStr = PutStrSJIS;
	else                           PutStr = PutStrUTF8;
/*
	// DumpPreamble
	fp.write("[preamble]\n");
	fp.write(`id: ${this.id}\n`);
	fp.write(`numerator: ${this.numerator}\n`);
	fp.write(`denominator: ${this.denominator}\n`);
	fp.write(`magnification: ${this.mag}\n`);
	fp.write(`comment: ${this.comment}\n`);
	// DumpPostamble
	fp.write("\n[postamble]\n");
	fp.write(`maxv: ${this.byconv(this.max_v)}\n`);
	fp.write(`maxh: ${this.byconv(this.max_h)}\n`);
	fp.write(`maxs: ${this.max_s}\n`);
	fp.write(`pages: ${this.total_pages}\n`);
	// DumpFontDefinitions
	fp.write("\n[font definitions]\n");
	for (let e of Object.getOwnPropertyNames(this.font_def).sort()) {
	    fp.write(`fntdef: ${this.font_def[e]['name']}`);
	    if (this.font_def[e]['design_size'] != this.font_def[e]['scaled_size']) {
		fp.write(` (${this.by_pt_conv(this.font_def[e]['design_size'])}) `);
	    }
	    fp.write(` at ${this.by_pt_conv(this.font_def[e]['scaled_size'])}\n`);
	}
*/
	// DumpPages
	for (let page of this.pages) {
	    let pos_stack = [{left: 0, top: 0, font_size:0 }];
	    for (let cmd of page['content']) {
		try {
		    if (cmd[0] == POP) {
			pos_stack.pop();
		    }
		    else if (cmd[0] == PUSH) {
			let cur = pos_stack[pos_stack.length-1];
			pos_stack.push({left: cur.left,
					top: cur.top,
					font_size: cur.font_size });
		    }
		    else if (cmd[0] == XXX1) {
			//fp.write(`xxx: ${cmd[1]}\n`);
		    }
		    else if (cmd[0] == DIR) {
			//fp.write(`dir: ${cmd[1]}\n`);
		    }
		    else if (cmd[0] == BEGIN_REFLECT) {
			//fp.write("begin_reflect:\n");
		    }
		    else if (cmd[0] == END_REFLECT) {
			//fp.write("end_reflect:\n");
		    }
		    else if (cmd[0] == SET_RULE) {
			//fp.write(`setrule: ${this.byconv(cmd[1][0])} ${this.byconv(cmd[1][1])}\n`);
		    }
		    else if (cmd[0] == PUT_RULE) {
			//fp.write(`putrule: ${this.byconv(cmd[1][0])} ${this.byconv(cmd[1][1])}\n`);
		    }
		    else if (cmd[0] == SET1) {
			let cur = pos_stack[pos_stack.length-1];
			fp.write(`<span style="position: absolute; left: ${cur.left}pt; top: ${cur.top}pt; font-size: ${cur.font_size};">${PutStr(cmd[1])}</span>\n`);
		    }
		    else if (cmd[0] == PUT1) {
			fp.write(`<span style="position: absolute; left: ${cur.left}pt; top: ${cur.top}pt; font-size: ${cur.font_size};">${PutStr(cmd[1])}</span>\n`);
		    }
		    else if (cmd[0] == FNT1) {
			let f = this.font_def[cmd[1]].name;
			let z = this.font_def[cmd[1]].scaled_size;
			pos_stack[pos_stack.length-1].font_size = +this.by_pt_conv(this.font_def[cmd[1]].scaled_size).slice(0,-2);
		    }
		    else if (cmd[0] == GLYPHS) {
			//fp.write(`setglyphs: ${this.DumpGlyphs(cmd[1][0], cmd[1][1])}\n`);
		    }
		    else if (cmd[0] == RIGHT1) {
			pos_stack[pos_stack.length-1].left += +this.byconv(cmd[1]).slice(0,-2);
		    }
		    else if (cmd[0] == DOWN1) {
			pos_stack[pos_stack.length-1].top += +this.byconv(cmd[1]).slice(0,-2);
		    }
		    else if (cmd[0] == W1) {
			//fp.write(`w: ${this.byconv(cmd[1])}\n`);
		    }
		    else if (cmd[0] == X1) {
			pos_stack[pos_stack.length-1].left = +this.byconv(cmd[1]).slice(0,-2);
		    }
		    else if (cmd[0] == Y1) {
			pos_stack[pos_stack.length-1].top = +this.byconv(cmd[1]).slice(0,-2);
		    }
		    else if (cmd[0] == Z1) {
			//fp.write(`z: ${this.byconv(cmd[1])}\n`);
		    }
		    else if (cmd[0] == W0) {
			//fp.write("w0:\n");
		    }
		    else if (cmd[0] == X0) {
			//fp.write("x0:\n");
		    }
		    else if (cmd[0] == Y0) {
			//fp.write("y0:\n");
		    }
		    else if (cmd[0] == Z0) {
			//fp.write("z0:\n");
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
	    break; // stop after the first page
	}
    }

    DumpGlyphs(w, g) {
	let yPresent = false;
	for (let i of g) {
	    if (g[i]["y"] != 0)
		yPresent = true;
	}

	let glyphs = [];
	for (let i in g) {
	    gid = "gid%s" % g[i]["id"]
	    x = this.byconv(g[i]["x"])
	    y = this.byconv(g[i]["y"])
	    if (yPresent) {
		glyphs.append("%s(%s, %s)" % (gid, x, y))
	    }
	    else {
		glyphs.append("%s(%s)" % (gid, x))
	    }

	    return "%s %s" % (this.byconv(w), " ".join(glyphs))
	}
    }

    //////////////////////////////////////////////////////////
    // Misc Functions
    //////////////////////////////////////////////////////////
    ComputeConversionFactors() {
	this.sp_conv = (this.numerator / 25400000.) * (473628672. / this.denominator);
	this.pt_conv = (this.numerator / 25400000.) * (7227. / this.denominator);
	this.bp_conv = (this.numerator / 254000.) * (72. / this.denominator);
	this.mm_conv = (this.numerator / 10000.) / this.denominator;
	this.cm_conv = (this.numerator / 100000.) / this.denominator;
	this.in_conv = (this.numerator / 254000.) * (1. / this.denominator);
    }

  ConvLen(s) {
      // if it's an integer (there must be an easier way?)
      let f = parseFloat(s.substr[0,s.length-2])

      let m = s.substr(s.length-2,2);
      if      (m == "pt") return f / this.pt_conv;
      else if (m == "in") return f / this.in_conv;
      else if (m == "mm") return f / this.mm_conv;
      else if (m == "cm") return f / this.cm_conv;
      else if (m == "bp") return f / this.bp_conv;
      else if (m == "sp") return f / this.sp_conv;
      else {
	  return f / this.pt_conv
      }
  }

    GetFntDef(s) {
	f = {}
	try {
	    n, size = s.split('(', 1)
	    d, q = size.split(')', 1)
	}
	catch (e) {
	    n, q = s.split(' ', 1)
	}
	n = n.strip(); q = q.strip()
	if (n.startswith('"') && n.endswith('"')) {
	    f['native'] = true
	    n = n.strip('"')
	    flags = 0
	    color = 0
	    extend = 0
	    slant = 0
	    embolden = 0
	    try {
		name, ext = n.split(':')
	    }
	    catch (e) {
		name, ext = n, ""
	    }

	    try {
		name, index = name.split('[')
		index = index.split(']')[0]
	    }
	    catch (e) {
		index = 0
	    }

	    if (ext) {
		ext = ext.split(';')
		for (opt of ext) {
		    try {
			key, value = opt.split('=')
		    }
		    catch (e) {
			key, value = opt, ""
		    }
		    if (key == "color") {
			flags |= XDV_FLAG_COLORED
			color = int(value, 16)
		    }
		    if (key == "vertical") {
			flags |= XDV_FLAG_VERTICAL
		    }
		    if (key == "extend") {
			flags |= XDV_FLAG_EXTEND
			extend = int(value)
		    }
		    if (key == "slant") {
			flags |= XDV_FLAG_SLANT
			slant = int(value)
		    }
		    if (key == "embolden") {
			flags |= XDV_FLAG_EMBOLDEN
			embolden = int(value)
		    }
		}
	    }

	    f['name'] = name
	    f['index'] = int(index)
	    f['flags'] = flags
	    f['color'] = color
	    f['extend'] = extend
	    f['slant'] = slant
	    f['embolden'] = embolden
	}
	else {
	    f['native'] = false
	    f['name'] = n
	}

	if (q.substr(0,2) == "at") q = q.substr(2);
	q = this.ConvLen(q.strip());
	try {
	    d = this.ConvLen(d.strip());
	}
	catch (e) {
	    d = q;
	}

	f['design_size'] = d;
	f['scaled_size'] = q;
	f['checksum'] = 0;

	return f;
    }

    by_sp_conv(a) {
	let v = this.sp_conv * a;
	return `${v}sp`;
    }

    by_pt_conv(a) {
	let v = this.pt_conv * a;
        return `${v}pt`;
    }

    by_bp_conv(a) {
	let v = this.bp_conv * a;
        return `${v}bp`;
    }

    by_mm_conv(a) {
	let v = this.mm_conv * a;
        return `${v}mm`;
    }

    by_cm_conv(a) {
	let v = this.cm_conv * a;
        return `${v}cm`;
    }

    by_in_conv(a) {
	let v = this.in_conv * a;
        return `${v}in`;
    }
}
/*
////////////////////////////////////////////////////////////
// Misc Functions for Main Routine
////////////////////////////////////////////////////////////
def ProcessOptions():
  usage = """%prog [options] dvi_file|dvi_dump_file

DVIasm is a Python script to support changing or creating DVI files
via disassembling into text, editing, and then reassembling into
binary format. It is fully documented at

http://tug.org/TUGboat/Articles/tb28-2/tb89cho.pdf 
http://ajt.ktug.kr/assets/2008/5/1/0201cho.pdf"""

  version = """This is %prog-20150412 by Jin-Hwan Cho (Korean TeX Society)
  
Copyright (C) 2007-2008 by Jin-Hwan Cho <chofchof@ktug.or.kr>
Copyright (C) 2011-2015 by Khaled Hosny <khaledhosny@eglug.org>

This is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version."""

  parser = OptionParser(usage=usage, version=version)
  parser.add_option("-u", "--unit",
                    action="store", type="string", dest="unit",
                    metavar="STR",
                    help="unit (sp, pt, bp, mm, cm, in) [default=%default]")
  parser.add_option("-o", "--output",
                    action="store", type="string", dest="output",
                    metavar="FILE",
                    help="filename for output instead of stdout")
  parser.add_option("-e", "--encoding",
                    action="store", type="string", dest="encoding",
                    metavar="STR",
                    help="encoding for input/output [default=%default]")
  parser.add_option("-t", "--tabsize",
                    action="store", type="int", dest="tabsize",
                    metavar="INT",
                    help="tab size for push/pop [default=%default]")
  parser.add_option("-p", "--ptex",
                    action="store_true", dest="ptex", default=false,
                    help="extended DVI for Japanese pTeX")
  parser.add_option("-s", "--subfont",
                    action="append", type="string", dest="subfont",
                    metavar="STR",
                    help="the list of fonts with UCS2 subfont scheme (comma separated); disable internal subfont list if STR is empty")
  parser.set_defaults(unit='pt', encoding='utf8', tabsize=2)
  (options, args) = parser.parse_args()
  if not options.unit in ['sp', 'pt', 'bp', 'mm', 'cm', 'in']:
    parser.error("invalid unit name '%s'!" % options.unit)
  if options.tabsize < 0: 
    parser.error("negative tabsize!")
  if not options.encoding in ['ascii', 'latin1', 'utf8', 'sjis']:
    parser.error("invalid encoding '%s'!" % options.encoding)
  if options.ptex:
    global is_ptex
    is_ptex = true
    if not options.encoding in ['utf8', 'sjis']:
      parser.error("invalid encoding '%s' for Japanese pTeX!" % options.encoding)
  if options.subfont:
    global subfont_list
    if not options.subfont[0]: // disable subfont
      subfont_list = []
    for l in options.subfont:
      subfont_list.extend([f.strip() for f in l.split(',')])
  if len(args) != 1:
    parser.error("try with the option --help!")
  return (options, args)
*/

function IsDVI(buffer) {
    if (buffer[0] != PRE) return false;
    if (buffer[buffer.length-4] != 223) return false; // 223?
    return true;
}

if (typeof(exports) != 'undefined') {
    console.log(process.argv[2]);
    let dvi = DVI.Load(process.argv[2]);
    dvi.DumpToFile(process.stdout);
}
