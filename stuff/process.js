
let ftm = {
	dpcm: {
		// keys for arrays represent each sample
		len: [],
		addr: [],
		data: {},
	},
	inst: [],
	track: [],
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
	console.log(ftm);
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
	let line;
	do {
		data.i++;
		line = data.lines[data.i];
		console.log(line);
		let args = line.split(' ').filter(n => n);
		let inst_id = parseInt(args[1]);
		if (args[0] == 'INST2A03') {
			ftm.inst.push({});
			// XXX stash instrument data here
			inst_count++;
		}
		if (args[0] == 'KEYDPCM') {
			ftm.inst[inst_id].dpcm = ftm.inst[inst_id].dpcm ?? [];
			ftm.inst[inst_id].dpcm.push({
				trig: parseInt(args[2], 10) * 12 + parseInt(args[3], 10),
				samp: args[4],
				freq: args[5],
			});
		}
	} while (line !== '');
}

const ftm_process_macros = () => {
}

const ftm_process_pattern = () => {
	// loop over entire pattern and acquire all data
	let track = ftm.track[track_id];
	let row = track.order_counter;
	row = parseInt(data.lines[data.i].split(' ')[1], 16);
	let order = track.orders.map(x => parseInt(x[row], 16));
	for (let i = 0; i < 5; i++) track.pattern_data[i][order[i]] = [];
	do {
		data.i++;
		let line = data.lines[data.i];
		if (line == '') break;
		let args = line.split(':').splice(1);
		args.forEach((line, chan) => {
			let args = line.split(' ');
			let val;
			if (args[1] == '...') val = 0xff;
			else if (args[1] == '---') val = 0xfe;
			else if (args[1] == '===') val = 0xfd;
			else {
				val = parseInt(notes.indexOf(args[1].slice(0, 2)), 10) + args[1].slice(2) * 12;
				if (chan == 3) {
					val = parseInt(args[1].slice(0, 1), 16);
				}
				if (chan == 4) {
					val = ftm.inst[parseInt(args[2])].dpcm.findIndex((x) => x.trig === val);
				}
			}
			track.pattern_data[chan][order[chan]].push(val);
		});
	} while (data.lines[data.i] !== '');
	track.order_counter++;
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
		pattern_data: [ {}, {}, {}, {}, {} ],
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
	do {
		line = data.lines[data.i];
		console.log(line);
		args = line.substr(11).split(' ');
		args.forEach((a, i) => {
			track.orders[i].push(a);
			track.pattern_sets[i].add(a);
		});
		data.i++;
		order_length++;
	} while (data.lines[data.i] !== '');
	track.order_length = order_length;
	track.order_counter = 0;
	console.log('order_length: ' + order_length);
	// setup reference keys
	for (let i = 0; i < 5; i++) {
		track.pattern_keys[i] = [...track.pattern_sets[i]];
	}
	ftm.track[track_id] = track;
	console.log(track);
}

