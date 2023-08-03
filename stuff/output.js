
//let output = {};
let outtarg;

const ftm_output = () => {
	//delete output.dpcm;
	output.dpcm = dpcm_output();


	Object.entries(output).forEach((out) => {
		const [key, val] = out;
		outtarg.innerHTML += '<h3>' + key + '</h3>';
		outtarg.innerHTML += '<pre>' + val + '</pre>';	
	});
}


const dpcm_output = () => {
	let out = '';
	let lengths = [];
	let addresses = [];
	for (const [key, val] of Object.entries(ftm.dpcm.data)) {
		out += '\nftm_dpcm_data_' + key + ':';
		let i = 0;
		val.forEach((val) => {
			if (i % 32 == 0) out += '\n\thex ';
			out += tohex(val);
			i++;
		});
		let fill = val.length % 64;
		for (let j = fill; j < 64; j++) {
			if (i % 32 == 0) out += '\n\thex ';
			out += '55'; // XXX should be 0x00?
			i++;
		}
		lengths.push(Math.ceil(ftm.dpcm.len[key] / 16));
		addresses.push(Math.ceil(ftm.dpcm.addr[key] / 64));
	}
	out += '\nftm_dpcm_len:\n\t\hex ';
	lengths.forEach(x => out += tohex(x));
	out += '\nftm_dpcm_addr:\n\thex ';
	addresses.forEach(x => out += tohex(x));
	out += '\n';
	return out;
}
