import WASI from './wasi.esm.js';

const wasmPath = '../build/molfile_to_inchi.wasm';
const memory = new WebAssembly.Memory({ initial: 10 });

const inputMaxBytes = 0x8000;
const outputMaxBytes = 0x4000;
(async () => {
  const response = await fetch(wasmPath + '/molfile_to_inchi.wasm');
  const bytes = await response.arrayBuffer();
  const wasi = new WASI();
  const { instance } = await WebAssembly.instantiate(bytes, {
    env: { memory }, wasi_snapshot_preview1: wasi.wasiImport
  });
  const pInput = instance.exports.malloc(inputMaxBytes);
  const pOptions = instance.exports.malloc(0x100);
  const pOutput = instance.exports.malloc(outputMaxBytes);  

  const toKey = (inchi) => {
	    inputView.set(new TextEncoder().encode(inchi + "\0"), pInput);
	    const ret = instance.exports.inchi_to_inchikey(pInput, pOutput);
	    const outputView = new Uint8Array(memory.buffer.slice(pOutput, pOutput + outputMaxBytes));
	    return new TextDecoder().decode(outputView.subarray(0, outputView.indexOf(0)));
	  };

  window.molfileToInChI = (molfile,options) => {
	    options || (options = "");
	    if (molfile.length + 1 > inputMaxBytes) {
	    	alert("Model data is over the maximum of " + inputMaxBytes + " bytes.");
	    	return "";
	    } 
	    const encoder = new TextEncoder();
	    const decoder = new TextDecoder();

	    const inputView = new Uint8Array(memory.buffer);
	    inputView.set(encoder.encode(molfile + "\0"), pInput);
	    inputView.set(encoder.encode(options + "\0"), pOptions);

	    const result = instance.exports.molfile_to_inchi(pInput, pOptions, pOutput);

	    const outputView = new Uint8Array(memory.buffer.slice(pOutput, pOutput + outputMaxBytes));
	    const o = outputView.subarray(0, outputView.indexOf(0));
	    const output = decoder.decode(o);
	    return (options.toLowerCase().indexOf("key") >= 0 ? toKey(output) : output);
	  };
  
  window.inchiToInChIKey = (inchi) => {
		return toKey(inchi);
	  };

  window.dispatchEvent(new Event('InChIReady'));
})();