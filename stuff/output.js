
//let output = {};
let outtarg;

const ftm_output = () => {
	//delete output.dpcm;
	output.dpcm = dpcm_output();
	output.dpcm += inst_output();
	output.tracks = tracks_output();

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

const inst_output = () => {
	let samp_out = 'ftm_dpcm_samp_table: \n\thex ';
	let freq_out = 'ftm_dpcm_freq_table: \n\thex ';
	// XXX multiple instruments with dpcm may fail
	ftm.inst.forEach(x => {
		if (Array.isArray(x.dpcm)) x.dpcm.forEach(x => {
			samp_out += tohex(parseInt(x.samp));
			freq_out += tohex(parseInt(x.freq));
		});
	});
	return samp_out + '\n' + freq_out;
}

const tracks_output = () => {
	let out = '';
	ftm.track.forEach(track => {
		out += '\n; TRACK ' + tohex(track.id) + ' ' + track.title;
		// track orders
		out += '\nftm_track_' + track.id + '_order:\n';
		for (let i = 0; i < track.order_length; i++) {
			out += '\thex ';	
			for (let chan = 0; chan < 5; chan++) {
				let val = track.pattern_keys[chan].indexOf(track.orders[chan][i]);
				out += tohex(parseInt(val));
			}
			out += '\n';
		}
		// track patterns
		for (let chan = 0; chan < 5; chan++) {
			let patterns_done = new Set();
			for (let row = 0; row < track.order_length; row++) {
				let pattern_id = track.orders[chan][row];
				let ref_id =  track.pattern_keys[chan].indexOf(pattern_id);
				if (!patterns_done.has(ref_id)) {
					patterns_done.add(ref_id);
					ref_hex = tohex(ref_id);
					out += 'ftm_track_' + track.id + '_chan_' + chan + '_pattern_';
					out += ref_hex + ':';
					for (let i = 0; i < track.pattern_length; i++) {
						if (i % 32 == 0) out += '\n\thex ';
						out += tohex(track.pattern_data[chan][parseInt(pattern_id, 16)][i]);
					}
					out += '\n';
				}
			}
		}
		// pattern lookup tables
		for (let chan = 0; chan < 5; chan++) {
			let table_hi = 'ftm_track_' + track.id + '_chan_' + chan + '_patterns_hi:\n';
			let table_lo = 'ftm_track_' + track.id + '_chan_' + chan + '_patterns_lo:\n';
			track.pattern_keys[chan].forEach((x, i) => {
				let label = '#ftm_track_' + track.id + '_chan_' + chan + '_pattern_' + tohex(i);
				table_hi += '\tbyte >' + label + '\n';
				table_lo += '\tbyte <' + label + '\n';
			});
			out += table_hi + table_lo;
		}
		// pattern lookup tables lookup table
		out += 'ftm_track_' + track.id + '_channel_pattern_tables_hi:\n';
		for (let chan = 0; chan < 5; chan++) {
			out += '\tbyte >#ftm_track_' + track.id + '_chan_' + chan + '_patterns_hi\n';
		}
		out += 'ftm_track_' + track.id + '_channel_pattern_tables_lo:\n';
		for (let chan = 0; chan < 5; chan++) {
			out += '\tbyte >#ftm_track_' + track.id + '_chan_' + chan + '_patterns_hi\n';
		}
	});
	return out;
}
