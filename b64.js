function b64_decode(input) {
    var codes = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

    if (input.length % 4 != 0)
        throw new Error("Invalid base64 input");

    var decoded = new Uint8Array(((input.length * 3) / 4) - (input.indexOf('=') > 0 ? (input.length - input.indexOf('=')) : 0));
    var j = 0;
    var b = Array(4);
    for (var i = 0; i < input.length; i += 4)     {
        // This could be made faster (but more complicated) by precomputing these index locations
        b[0] = codes.indexOf(input[i]);
        b[1] = codes.indexOf(input[i + 1]);
        b[2] = codes.indexOf(input[i + 2]);
        b[3] = codes.indexOf(input[i + 3]);
        decoded[j++] = ((b[0] << 2) | (b[1] >> 4));
        if (b[2] < 64)      {
            decoded[j++] = ((b[1] << 4) | (b[2] >> 2));
            if (b[3] < 64)  {
                decoded[j++] = ((b[2] << 6) | b[3]);
	    }
        }
    }
    
    return decoded;
}
