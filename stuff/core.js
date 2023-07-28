
let tohex = (x) => x.toString(16).padStart(2, '0'); 

let output = {};
let inst = [];

const ftm_process = (file, data) => {
	let lines = data.split(/\r?\n/);
	lines.forEach((line, i) => {
		let luc = line.trim().toUpperCase();
		if (luc == '# DPCM SAMPLES') ftm_process_dpcm(lines, i);
		if (luc == '# INSTRUMENTS') ftm_process_instruments(lines, i);
		if (luc == '# MACROS') ftm_process_macros(lines, i);
		if (luc == 'PATTERN 0A') ftm_process_pattern(lines, i);
	});
}

const ftm_process_dpcm = (lines, i) => {
	let out = '';
	let length = 0;
	let lengths = [];
	let dpcm_count = 0;
	let line_count = 0;
	let line_counts = [];
	// rip them samples
	do {
		i++;
		let line = lines[i];
		if (line.indexOf('DPCMDEF') == 0 || line == '') {
			if (length % 64 != 0) {
				let fill = length % 64;
				for (let i = fill; i < 64; i++) {
					if (i % 32 == 0) {
						out += '\n hex ';
						line_count++;
					}
					out += '00';
				}
				out += '\n';
			}
			length = 0;
			if (line != '') {
				line_counts.push(line_count);
				out += 'ftm_dpcm_data_' + lengths.length + ':';
				lengths.push(parseInt(line.substring(12, 18)));
				dpcm_count++;
			}
		}
		if (line.indexOf('DPCM : ') == 0) {
			let data = line.slice(7).replace(/\s/g, '').toLowerCase().trim();
			length += data.length / 2;
			out += '\n hex ' + data;
			line_count++;
		}
	} while (lines[i] !== '');
	// create look up tables
	out += "ftm_dpcm_len:\n hex ";
	lengths.forEach(x => out += tohex(Math.ceil(x / 16)));
	out += "\nftm_dpcm_addr:\n hex ";
	line_counts.forEach(x => out += tohex(Math.ceil(x / 2)));
//	console.log(out);
	output.dpcm = out;
}

const ftm_process_instruments = (lines, i) => {
	let inst_count = -1;
	do {
		i++;
		let line = lines[i];
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
	} while (lines[i] !== '');
	console.log(inst[0].dpcm);
	let samp_out = 'ftm_dpcm_samp_table: \n hex ';
	let freq_out = 'ftm_dpcm_freq_table: \n hex ';
	inst[0].dpcm.forEach(x => {
		samp_out += tohex(parseInt(x.samp));
		freq_out += tohex(parseInt(x.freq));
		console.log('freq: ' + x.freq);
	});
	console.log(samp_out + '\n' + freq_out);
	console.log(inst[0].dpcm);
}

const ftm_process_macros = (lines, i) => {
}
const notes = [ 'C-', 'C#', 'D-', 'D#', 'E-', 'F-' ,'F#', 'G-' ,'G#', 'A-', 'A#', 'B' ];
const ftm_process_pattern = (lines, i) => {
	let patt = [];
	do {
		i++;
		let line = lines[i];
		if (line == '') break;
		let args = line.split(':');
		let dpcm = args[5];
		args = dpcm.split(' ');
		if (args[1] == '...') {
			patt.push(0xff);
		}
		else {
			let note = parseInt(notes.indexOf(args[1].slice(0, 2)), 10) + args[1].slice(2) * 12;
			let i = inst[0].dpcm.findIndex((x) => x.trig === note);
			patt.push(i);
		}
	} while (lines[i] !== '');
	let out = 'ftm_pattern: ';
	patt.forEach((x, i) => {
		if (i % 32 == 0) out += '\n hex ';
		out += tohex(x);
	});
	console.log(out);
}

window.addEventListener("DOMContentLoaded", () => {
	const cont = document.getElementById("containment");
	const droptarg = document;
	const output = document.getElementById("output");
	const domp = new DOMParser();
	const br = "<br>";
	// drop handler
	droptarg.addEventListener("drop", (e) => {
		e.preventDefault();
		cont.classList.remove("dragover");
		output.innerHTML = '';
		[...e.dataTransfer.items].forEach((item, i) => {
			if (item.kind === 'file') {
				const file = item.getAsFile();
				const r = new FileReader();
				r.readAsText(file);
				r.onload = () => {
					ftm_process(file, r.result);
				};
			}
		});
	});
	// drag hover
	droptarg.addEventListener("dragover", (e) => {
		e.preventDefault();
		cont.classList.add("dragover");
	});
	// drag end
	droptarg.addEventListener("dragleave", (e) => {
		e.preventDefault();
		cont.classList.remove("dragover");
	});
	console.log('core intiialized');
});
