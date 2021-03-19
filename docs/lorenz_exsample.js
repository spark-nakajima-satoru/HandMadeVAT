// position generator of lorenz atractor
VAT.positionGenerator.init = function() {
    let tmpp = new Array(VAT.numSprites);
	for(let i = 0; i < VAT.numSprites; i++) {
		let p = new VAT.Point();
		p.x = (Math.random() * 2.0 - 1.0) * 0.025;
		p.y = (Math.random() * 2.0 - 1.0) * 0.025;
		p.z = (Math.random() * 2.0 - 1.0) * 0.025;
		tmpp[i] = p;
	}
    VAT.positionGenerator.temporal = { tempp: tmpp };
}
VAT.positionGenerator.compute = function(spriteID, frame) {
    let tmpp = VAT.positionGenerator.temporal.tempp[spriteID];
    const p = new VAT.Point(tmpp.x, tmpp.y, tmpp.z);
    for(let i = 0; i < 60; i++) {
        const x = tmpp.x;
        const y = tmpp.y;
        const z = tmpp.z;
        const dt = 1.0 / 1000.0;
        tmpp.x = x + (10.0 * (-x + y)) * dt;
        tmpp.y = y + (-x * z + 28.0 * x - y) * dt;
        tmpp.z = z + (x * y - 8.0 / 3.0 * z) * dt;
    }
    return p;
};

// color generator example
VAT.colorGenerator.compute = function(spriteID, frame) {
    let c = new VAT.Color(1.0, 1.0, 1.0, 1.0);
	const t = frame / (VAT.numFrames - 1);
	const s = spriteID / (VAT.numSprites - 1);
	const tr = t * (Math.PI * 2.0 * (1.0 + s * 0.8));
	const tg = t * (Math.PI * 3.0 * (1.0 + s * 0.7));
	const tb = t * (Math.PI * 5.0 * (1.0 + s * 0.6));
    c.r = cos(tr) * 0.5 + 0.5;
    c.g = cos(tg) * 0.5 + 0.5;
    c.b = cos(tb) * 0.5 + 0.5;
    c.a = 1.0;
    return c;
};