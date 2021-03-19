let VAT = {
    // input values
    savePrefix: "vat",
    numSprites: 0,
    numFrames: 0,
    maxTexWidth: 1,

    // computed values
    texWidth: 1,
    texHeight: 1,
    rowsPerFrame: 1,
    boundsMin: -1.0,
    boundsMax: 1.0,

    // functions
    positionGenerator: {
        // functions
        init: null,    // option
        compute: null, // required
        final: null,   // option
        // free space
        temporal: null
    },
    colorGenerator: {
        // functions
        init: null,
        compute: null,
        final: null,
        // free space
        temporal: null
    },

    Point: function(x, y, z) {
        this.x = (x != undefined && typeof(x) == 'number') ? x : 0;
        this.y = (y != undefined && typeof(y) == 'number') ? y : 0;
        this.z = (z != undefined && typeof(z) == 'number') ? z : 0;
    },
    Color: function(r, g, b, a) {
        this.r = (r != undefined && typeof(r) == 'number') ? r : 0;
        this.g = (g != undefined && typeof(g) == 'number') ? g : 0;
        this.b = (b != undefined && typeof(b) == 'number') ? b : 0;
        this.a = (a != undefined && typeof(a) == 'number') ? a : 0;
    },

    npot: function(x) {
        if(x <= 1) return 1;
        let a = 1;
        x = Math.ceil(x);
        while(a < x) {
            a <<= 1;
        }
        return a;
    }
};

VAT.Point.prototype.selectMax = function(p) {
    this.x = Math.max(this.x, p.x);
    this.y = Math.max(this.y, p.y);
    this.z = Math.max(this.z, p.z);
};
VAT.Point.prototype.selectMin = function(p) {
    this.x = Math.min(this.x, p.x);
    this.y = Math.min(this.y, p.y);
    this.z = Math.min(this.z, p.z);
};
VAT.Point.prototype.mad = function(m, a) {
    this.x = this.x * m + a;
    this.y = this.y * m + a;
    this.z = this.z * m + a;
};
VAT.Color.prototype.packToU8 = function() {
    const u8r = Math.min(255, Math.max(0.0, this.r * 256.0));
    const u8g = Math.min(255, Math.max(0.0, this.g * 256.0));
    const u8b = Math.min(255, Math.max(0.0, this.b * 256.0));
    const u8a = Math.min(255, Math.max(0.0, this.a * 256.0));
    return [u8r, u8g, u8b, u8a];
};

//
const ColladaTemplate = {
    begin:
`<?xml version="1.0" encoding="utf-8"?>
<COLLADA xmlns="http://www.collada.org/2005/11/COLLADASchema" version="1.4.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<asset>
<unit name="meter" meter="1"/>
<up_axis>Y_UP</up_axis>
</asset>
<library_geometries>
<geometry id="vat-geometry" name="vatgeom">
<mesh>
`,
    possrc:[
`<source id="vat-positions">
<float_array id="vat-positions-array" count="`,
// num of positions * 3,
`">`,
// x0 y0 z0 ...
`</float_array>
<technique_common>
<accessor source="#vat-positions-array" count="`,
// num of positions
`" stride="3">
<param name="X" type="float"/>
<param name="Y" type="float"/>
<param name="Z" type="float"/>
</accessor>
</technique_common>
</source>
`
    ],
    uv1:
`<source id="vat-uvs1">
<float_array id="vat-uvs1-array" count="8"> 0 0 1 0 1 1 0 1 </float_array>
<technique_common>
<accessor source="#vat-uvs1-array" count="4" stride="2">
<param name="S" type="float"/>
<param name="T" type="float"/>
</accessor>
</technique_common>
</source>
`,
    uv2:[
`<source id="vat-uvs2">
<float_array id="vat-uvs2-array" count="`,
// num of vertices * 2
`">`,
// u0 v0 ...
`</float_array>
<technique_common>
<accessor source="#vat-uvs2-array" count="`,
// num of vertices
`" stride="2">
<param name="S" type="float"/>
<param name="T" type="float"/>
</accessor>
</technique_common>
</source>
`
    ],
    vtx:
`<vertices id="vat-vertices">
<input semantic="POSITION" source="#vat-positions"/>
</vertices>`,
    tris:[
`<triangles count="`,
// num of triangles
`">
<input semantic="VERTEX" source="#vat-vertices" offset="0"/>
<input semantic="TEXCOORD" source="#vat-uvs1" offset="1" set="0"/>
<input semantic="TEXCOORD" source="#vat-uvs2" offset="0" set="1"/>
<p>`,
// t0 0 t1 1 t2 2 t2 2 t3 3 t0 0 ...
`</p>
</triangles>
`
    ],
    end:
`</mesh>
</geometry>
</library_geometries>
<library_visual_scenes>
<visual_scene id="vat-scene" name="vatscene">
<node id="vat-mesh" name="vatmesh" type="NODE">
<matrix sid="transform"> 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 </matrix>
<instance_geometry url="#vat-geometry" name="vatmeshgeom"/>
</node>
</visual_scene>
</library_visual_scenes>
<scene>
<instance_visual_scene url="#vat-scene"/>
</scene>
</COLLADA>`
};

//
window.addEventListener('load', ()=>{
    let boundMinInput = document.getElementById('bndmin');
    let boundMaxInput = document.getElementById('bndmax');
    let texWidthInput = document.getElementById('texw');
    let texHeightInput = document.getElementById('texh');
    let posSrcTextArea = document.getElementById('possrc');
    let colorSrcTextArea = document.getElementById('colsrc');

    function updateTexSpec() {
        VAT.texWidth = Math.min(VAT.npot(VAT.numSprites), VAT.maxTexWidth);
        VAT.rowsPerFrame = Math.ceil(VAT.numSprites / VAT.texWidth);
        VAT.texHeight = VAT.rowsPerFrame * VAT.numFrames;
   
        texWidthInput.value = VAT.texWidth;
        texHeightInput.value = VAT.texHeight;
    };

    function saveMesh() {
        const numVerts = VAT.numSprites * 4;
        let dae = ColladaTemplate.begin;
        dae += ColladaTemplate.possrc[0];
        dae += numVerts * 3;
        dae += ColladaTemplate.possrc[1];
        let posarray = new Array(numVerts * 3);
        let morton = (a, s)=>{
            let x = 0, y = 0, z = 0;
            for(let i = 0; i < 10; i++) {
                const mask = 1 << i;
                x |= a & mask;
                y |= (a >> 1) & mask;
                z |= (a >> 2) & mask;
                a = a >> 2;
            }
            return [x * s, y * s, z * s];
        };
        for(let isprt = 0; isprt < VAT.numSprites; isprt++) {
            const i = isprt * 12;
            const scale = 0.1;
            const [ofx, ofy, ofz] = morton(isprt, scale * 2.2);
            posarray[i + 0] = -1.0 * scale + ofx;
            posarray[i + 1] = -1.0 * scale + ofy;
            posarray[i + 2] =  0.0 * scale + ofz;
            
            posarray[i + 3] =  1.0 * scale + ofx;
            posarray[i + 4] = -1.0 * scale + ofy;
            posarray[i + 5] =  0.0 * scale + ofz;
            
            posarray[i + 6] =  1.0 * scale + ofx;
            posarray[i + 7] =  1.0 * scale + ofy;
            posarray[i + 8] =  0.0 * scale + ofz;
            
            posarray[i +  9] = -1.0 * scale + ofx;
            posarray[i + 10] =  1.0 * scale + ofy;
            posarray[i + 11] =  0.0 * scale + ofz;
        }
        dae += posarray.join(' ');
        dae += ColladaTemplate.possrc[2];
        dae += numVerts;
        dae += ColladaTemplate.possrc[3];
        
        dae += ColladaTemplate.uv1;

        dae += ColladaTemplate.uv2[0];
        dae += numVerts * 2;
        dae += ColladaTemplate.uv2[1];
        let uv2array = new Array(numVerts * 2);
        for(let isprt = 0; isprt < VAT.numSprites; isprt++) {
            const u = ((isprt % VAT.texWidth) + 0.5) / VAT.texWidth;
            const v = 1.0 - (Math.floor(isprt / VAT.texWidth) + 0.5) / VAT.texHeight;
            const i = isprt * 8;
            uv2array[i + 0] = u;
            uv2array[i + 1] = v;
            uv2array[i + 2] = u;
            uv2array[i + 3] = v;
            uv2array[i + 4] = u;
            uv2array[i + 5] = v;
            uv2array[i + 6] = u;
            uv2array[i + 7] = v;
        }
        dae += uv2array.join(' ');
        dae += ColladaTemplate.uv2[2];
        dae += numVerts;
        dae += ColladaTemplate.uv2[3];

        dae += ColladaTemplate.vtx;

        const numTris = VAT.numSprites * 2;
        dae += ColladaTemplate.tris[0];
        dae += numTris;
        dae += ColladaTemplate.tris[1];
        let triarray = new Array(numTris * 12);
        for(let isprt = 0; isprt < VAT.numSprites; isprt++) {
            const index = isprt * 12;
            const iv = isprt * 4;
            //
            triarray[index + 0] = iv + 0;
            triarray[index + 1] = 0;

            triarray[index + 2] = iv + 1;
            triarray[index + 3] = 1;
            
            triarray[index + 4] = iv + 2;
            triarray[index + 5] = 2;

            //
            triarray[index + 6] = iv + 2;
            triarray[index + 7] = 2;

            triarray[index + 8] = iv + 3;
            triarray[index + 9] = 3;
            
            triarray[index + 10] = iv + 0;
            triarray[index + 11] = 0;
        }
        dae += triarray.join(' ');
        dae += ColladaTemplate.tris[2];

        dae += ColladaTemplate.end;

        const blob = new Blob([dae], {type:'application/octet-stream'});
        const dla = document.createElement('a');
        dla.setAttribute('href', URL.createObjectURL(blob));
        dla.setAttribute('download', VAT.savePrefix + '_mesh.dae');
        dla.click();
    };

    function savePositionTexture() {
        const srcText = posSrcTextArea.value;
        VAT.positionGenerator.init = null;
        VAT.positionGenerator.compute = null;
        VAT.positionGenerator.final = null;
        VAT.positionGenerator.temporal = null;

        eval(srcText);
        if(VAT.positionGenerator.compute == null) {
            alert("positionGenerator eval failed");
            return;
        }

        if(VAT.positionGenerator.init) {
            VAT.positionGenerator.init();
        }

        let posarray = new Array(VAT.numSprites);
        let minpos = new VAT.Point(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        let maxpos = new VAT.Point(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
        for(let ifrm = 0; ifrm < VAT.numFrames; ifrm++) {
            posarray[ifrm] = new Array(VAT.numSprites);
            for(let isprt = 0; isprt < VAT.numSprites; isprt++) {
                const p = VAT.positionGenerator.compute(isprt, ifrm);
                posarray[ifrm][isprt] = p;
                minpos.selectMin(p);
                maxpos.selectMax(p);
            }
        }

        if(VAT.positionGenerator.final) {
            VAT.positionGenerator.final();
        }
        VAT.positionGenerator.temporal = null;

        VAT.boundsMin = Math.min(minpos.x, Math.min(minpos.y, minpos.z));
        VAT.boundsMax = Math.max(maxpos.x, Math.max(maxpos.y, maxpos.z));

        boundMinInput.value = VAT.boundsMin;
        boundMaxInput.value = VAT.boundsMax;

        const cnvs = document.createElement('canvas');
        cnvs.width = VAT.texWidth;
        cnvs.height = VAT.texHeight;
        const cntx = cnvs.getContext('2d');
        const img = cntx.createImageData(VAT.texWidth, VAT.texHeight);

        const boundsOffset = VAT.boundsMin;
        const boundsScale = ((VAT.boundsMax - VAT.boundsMin) < 1e-4) ? 1.0 : (1.0 / (VAT.boundsMax - VAT.boundsMin));
        let tmpcol = new VAT.Color();
        let ipxl = 0;
        for(let ifrm = 0; ifrm < VAT.numFrames; ifrm++) {
            let ipxl = (VAT.rowsPerFrame * VAT.texWidth) * 4 * ifrm;
            for(let isprt = 0; isprt < VAT.numSprites; isprt++) {
                const p = posarray[ifrm][isprt];
                tmpcol.r = (p.x - boundsOffset) * boundsScale;
                tmpcol.g = (p.y - boundsOffset) * boundsScale;
                tmpcol.b = (p.z - boundsOffset) * boundsScale;
                tmpcol.a = 1.0;

                const [ur, ug, ub, ua] = tmpcol.packToU8();
                img.data[ipxl + 0] = ur;
                img.data[ipxl + 1] = ug;
                img.data[ipxl + 2] = ub;
                img.data[ipxl + 3] = ua;
                ipxl += 4;
            }
        }
        cntx.putImageData(img, 0, 0);

        const daturl = cnvs.toDataURL('image/png', 'image/oct-stream');
        const dla = document.createElement('a');
        dla.setAttribute('href', daturl);
        dla.setAttribute('download', VAT.savePrefix + '_position.png');
        dla.click();
    }
    
    function saveColorTexture() {
        const srcText = colorSrcTextArea.value;

        VAT.colorGenerator.init = null;
        VAT.colorGenerator.compute = null;
        VAT.colorGenerator.final = null;
        VAT.colorGenerator.temporal = null;

        eval(srcText);
        if(VAT.colorGenerator.compute == null) {
            alert("colorGenerator eval failed");
            return;
        }

        if(VAT.colorGenerator.init) {
            VAT.colorGenerator.init();
        }

        let colarray = new Array(VAT.numSprites);
        for(let ifrm = 0; ifrm < VAT.numFrames; ifrm++) {
            colarray[ifrm] = new Array(VAT.numSprites);
            for(let isprt = 0; isprt < VAT.numSprites; isprt++) {
                const c = VAT.colorGenerator.compute(isprt, ifrm);
                colarray[ifrm][isprt] = c;
            }
        }

        if(VAT.colorGenerator.final) {
            VAT.colorGenerator.final();
        }
        VAT.colorGenerator.temporal = null;

        const cnvs = document.createElement('canvas');
        cnvs.width = VAT.texWidth;
        cnvs.height = VAT.texHeight;
        const cntx = cnvs.getContext('2d');
        const img = cntx.createImageData(VAT.texWidth, VAT.texHeight);

        let ipxl = 0;
        for(let ifrm = 0; ifrm < VAT.numFrames; ifrm++) {
            let ipxl = (VAT.rowsPerFrame * VAT.texWidth) * 4 * ifrm;
            for(let isprt = 0; isprt < VAT.numSprites; isprt++) {
                const [ur, ug, ub, ua] = colarray[ifrm][isprt].packToU8();
                img.data[ipxl + 0] = ur;
                img.data[ipxl + 1] = ug;
                img.data[ipxl + 2] = ub;
                img.data[ipxl + 3] = ua;
                ipxl += 4;
            }
        }
        cntx.putImageData(img, 0, 0);

        const daturl = cnvs.toDataURL('image/png', 'image/oct-stream');
        const dla = document.createElement('a');
        dla.setAttribute('href', daturl);
        dla.setAttribute('download', VAT.savePrefix + '_color.png');
        dla.click();
    }

    function saveVATData() {
        let datajson = `[
    {
        "Name": "Sprite",
        "doubleTex": 0,
        "normData": 1,
        "numOfFrames": ${VAT.numFrames},
        "packNorm": 1,
        "packPscale": 0,
        "paddedX": 1.0,
        "paddedY": 1.0,
        "pivMax": 0.0,
        "pivMin": 0.0,
        "posMax": ${VAT.boundsMax},
        "posMin": ${VAT.boundsMin},
        "scaleMax": 1.0,
        "scaleMin": 1.0,
        "speed": 1.0,
        "width": 1.0,
        "height": 1.0
    }
]`;
        const blob = new Blob([datajson], {type:'application/octet-stream'});
        const dla = document.createElement('a');
        dla.setAttribute('href', URL.createObjectURL(blob));
        dla.setAttribute('download', VAT.savePrefix + '_data.json');
        dla.click();
    }

    //
    let savePrefixInput = document.getElementById('datprefix');
    let numSpritesInput = document.getElementById('numsprts');
    let numFramesInput = document.getElementById('numfrms');
    let maxTexWidthInput = document.getElementById('maxtexw');
    
    VAT.savePrefix = savePrefixInput.value;
    VAT.numSprites = parseInt(numSpritesInput.value);
    VAT.numFrames = parseInt(numFramesInput.value);
    VAT.maxTexWidth = parseInt(maxTexWidthInput.value);
    updateTexSpec();

    savePrefixInput.addEventListener('change', (e)=>{
        VAT.savePrefix = e.target.value;
    });
    numSpritesInput.addEventListener('change', (e)=>{
        VAT.numSprites = parseInt(e.target.value);
        updateTexSpec();
    });
    numFramesInput.addEventListener('change', (e)=>{
        VAT.numFrames = parseInt(e.target.value);
        updateTexSpec();
    });
    maxTexWidthInput.addEventListener('change', (e)=>{
        VAT.maxTexWidth = parseInt(e.target.value);
        updateTexSpec();
    });
    
    //
    let saveDataButton = document.getElementById('datagenbtn');
    saveDataButton.addEventListener('click', ()=>{
        saveVATData();
    });

    //
    let saveMeshButton = document.getElementById('meshgenbtn');
    saveMeshButton.addEventListener('click', ()=>{
        saveMesh();
    });

    //
    let savePosTexButton = document.getElementById('possrcbtn');
    savePosTexButton.addEventListener('click', ()=>{
        savePositionTexture();
    });
    
    //
    let saveColorTexButton = document.getElementById('colsrcbtn');
    saveColorTexButton.addEventListener('click', ()=>{
        saveColorTexture();
    });
    
    //
    let saveAllButton = document.getElementById('allgenbtn');
    saveAllButton.addEventListener('click', ()=>{
        savePositionTexture();
        saveColorTexture();
        saveMesh();
        saveVATData();
    });
});
