
let ftm = {
	dpcm: {
		// keys for arrays represent each sample
		len: [],
		addr: [],
		data: {},
	},
};

const ftm_process = (file, input) => {
	data.lines = input.split(/\r?\n/);
	data.length = data.lines.length;
	data.i = 0;
	while (data.i < data.length) {
		let line = data.lines[data.i];
		console.log(data.i + ' ' + line);
		let luc = line.trim().toUpperCase();
		if (luc == '# DPCM SAMPLES') ftm_process_dpcm();
		if (luc == '# INSTRUMENTS') ftm_process_instruments();
		if (luc == '# MACROS') ftm_process_macros();
		if (luc.substring(0, 7)  == 'PATTERN') ftm_process_pattern();
		if (luc.substring(0, 5)  == 'TRACK') ftm_process_track();
		data.i++;
	}
	ftm_output();
}

const ftm_process_dpcm = () => {
	let dpcm_id;
	let addr_prev = 0;
	data.i++;
	let line;
	do {
		// XXX could rip filename here too
		line = data.lines[data.i];
		if (line.indexOf('DPCMDEF') == 0) {
			dpcm_id = parseInt(line.substring(9, 11));
			let len = parseInt(line.substring(12, 18));
			ftm.dpcm.len[dpcm_id] = len;
			ftm.dpcm.addr[dpcm_id] = addr_prev;
			addr_prev += ((len + 63) & (-64));
			console.log(tohex(addr_prev / 64));
		}
		if (line.indexOf('DPCM : ') == 0) {
			if (typeof ftm.dpcm.data[dpcm_id] == 'undefined') ftm.dpcm.data[dpcm_id] = [];
			let data = line.slice(7).trim().split(' ');
			data.forEach((val) => {
				ftm.dpcm.data[dpcm_id].push(parseInt(val, 16));
			});
		}
		data.i++;
	} while (line !== '');
}

const ftm_process_instruments = () => {
	let inst_count = -1;
	do {
		data.i++;
		let line = data.lines[data.i];
		console.log(line);
		let args = line.split(' ').filter(n => n);
		if (args[0] == 'INST2A03') {
			inst.push({});
			// XXX stash instrument data here
			inst_count++;
		}
		if (args[0] == 'KEYDPCM') {
			inst[inst_count].dpcm = inst[inst_count].dpcm ?? [];
			inst[inst_count].dpcm.push({
				trig: parseInt(args[2], 10) * 12 + parseInt(args[3], 10),
				samp: args[4],
				freq: args[5],
			});
		}
	} while (data.lines[data.i] !== '');
	let samp_out = 'ftm_dpcm_samp_table: \n\thex ';
	let freq_out = 'ftm_dpcm_freq_table: \n\thex ';
	inst[0].dpcm.forEach(x => {
		samp_out += tohex(parseInt(x.samp));
		freq_out += tohex(parseInt(x.freq));
	});
	//console.log(samp_out + '\n' + freq_out);
}

const ftm_process_macros = () => {
}

const ftm_process_pattern = () => {
	let patt = [];
	let patterns = [ [], [], [], [], [] ];
	// loop over entire pattern and acquire all data
	do {
		data.i++;
		let line = data.lines[data.i];
		if (line == '') break;
		let args = line.split(':').splice(1);
		args.forEach((line, chan) => {
			let args = line.split(' ');
			if (args[1] == '...') patterns[chan].push(0xff);
			else if (args[1] == '---') patterns[chan].push(0xfe);
			else if (args[1] == '===') patterns[chan].push(0xfd);
			else {
				let val = parseInt(notes.indexOf(args[1].slice(0, 2)), 10) + args[1].slice(2) * 12;
				if (chan == 3) {
					val = parseInt(args[1].slice(0, 1), 16);
				}
				if (chan == 4) {
					val = inst[parseInt(args[2])].dpcm.findIndex((x) => x.trig === val);
				}
				patterns[chan].push(val);
			}
		});
		// XXX delete this
		let dpcm = args[4];
		args = dpcm.split(' ');
		if (args[1] == '...') {
			patt.push(0xff);
		}
		else {
			let note = parseInt(notes.indexOf(args[1].slice(0, 2)), 10) + args[1].slice(2) * 12;
			let i = inst[0].dpcm.findIndex((x) => x.trig === note);
			patt.push(i);
		}
	} while (data.lines[data.i] !== '');
	// loop over data and output exportable data
	for (let chan = 0; chan < 5; chan++) {
		if (track.row_counter < track.order_length) {
			let pattern_id = track.orders[chan][track.row_counter];
			let ref_id =  track.pattern_keys[chan].indexOf(pattern_id);
			ref_id = tohex(ref_id);
			if (typeof track.pattern_data[chan][pattern_id] == 'undefined') {
				let rows = [];
				let out = '\nftm_track_' + track.id + '_chan_' + chan + '_pattern_';
				out += ref_id + ': ';
				patt.forEach((x, i) => {
					rows.push(x);
					if (i % 32 == 0) out += '\n\thex ';
					out += tohex(x);
				});
				track.pattern_data[chan][pattern_id] = rows;
				output['track_' + track.id] += out;
				console.log(out);
			}
		}
	}
	console.log(patterns);
	// pattern lookup tables
	// XXX should be in its own function but not sure how to trigger
	let table_hi = 'ftm_track_' + track.id + '_chan_4_patterns_hi:\n';
	let table_lo = 'ftm_track_' + track.id + '_chan_4_patterns_lo:\n';
	track.pattern_keys[4].forEach((x, i) => {
		let label = '#ftm_track_' + track.id + '_chan_4_pattern_' + tohex(i);
		table_hi += '\tbyte >' + label + '\n';
		table_lo += '\tbyte <' + label + '\n';
	});
	output['track_' + track.id + '_pattern_tables'] = table_lo + table_hi;
	track.row_counter++;
}

const ftm_process_track = () => {
	// track data
	let line = data.lines[data.i];
	let args = line.replace(/ +(?= )/g,'').split(' ');
	track_id++;
	let title = args.slice(4).join(' ').substr(1);
	title = title.substr(0, title.length - 1);
	track = {
		id: track_id,
		orders: [ [], [], [], [], [] ],
		pattern_data: [ [], [], [], [], [] ],
		pattern_keys: [ [], [], [], [], [] ],
		pattern_length: args[1],
		pattern_sets: [ new Set(), new Set(), new Set(), new Set(), new Set() ],
		row_counter: 1,
		speed: args[2],
		tempo: args[3],
		title: title,
	};
	// effects columns per channel
	data.i++;
	line = data.lines[data.i];
	args = line.replace(/ +(?= )/g,'').split(' ');
	track.columns = args.slice(2);
	// song order data
	data.i += 2;
	let order_length = 0;
	let out = 'ftm_track_' + track.id + '_order:\n';
	do {
		line = data.lines[data.i];
		args = line.substr(11).split(' ');
		args.forEach((a, i) => {
			track.orders[i].push(a);
			track.pattern_sets[i].add(a);
		});
		data.i++;
		order_length++;
	} while (data.lines[data.i] !== '');
	console.log('order_length: ' + order_length);
	// setup reference keys
	for (let i = 0; i < 5; i++) {
		track.pattern_keys[i] = [...track.pattern_sets[i]];
	}
	// output pattern references
	for (let i = 0; i < order_length; i++) {
		out += '\thex ';	
		for (let chan = 0; chan < 5; chan++) {
			let val = track.pattern_keys[chan].indexOf(track.orders[chan][i]);
			out += tohex(parseInt(val));
		}
		out += '\n';
	}
	track.order_length = order_length;
	console.log(track);
	output['track_' + track.id] = out;
}

