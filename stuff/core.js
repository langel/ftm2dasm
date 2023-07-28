
let tohex = (x) => x.toString(16).padStart(2, '0'); 

let output = {};

const ftm_process = (file, data) => {
	let lines = data.split(/\r?\n/);
	lines.forEach((line, i) => {
		let luc = line.trim().toUpperCase();
		if (luc == '# MACROS') ftm_process_macros(lines, i);
		if (luc == '# DPCM SAMPLES') ftm_process_dpcm(lines, i);
	});
}

const ftm_process_dpcm = (lines, i) => {
	let out = '';
	let lengths = [];
	let dpcm_count = 0;
	// rip them samples
	do {
		i++;
		let line = lines[i];
		if (line.indexOf('DPCMDEF') == 0) {
			out += 'ftm_dpcm_data_' + lengths.length + ':\n';
			lengths.push(parseInt(line.substring(12, 18)));
			dpcm_count++;
		}
		if (line.indexOf('DPCM : ') == 0) {
			out += ' hex ' + line.slice(7).replace(/\s/g, '').toLowerCase() + '\n';
		}
	} while (lines[i] !== '');
	// create look up tables
	out += "ftm_dpcm_length_lo:\n hex ";
	lengths.forEach(x => out += tohex(x & 0xff));
	out += "\nftm_dpcm_length_hi:\n hex ";
	lengths.forEach(x => out += tohex(x >> 8));
	out += "\nftm_dpcm_addr_lo:\n";
	lengths.forEach((x, i) => out += ' byte #<ftm_dpcm_data_' + i + '\n');
	out += "ftm_dpcm_addr_hi:\n";
	lengths.forEach((x, i) => out += ' byte #>ftm_dpcm_data_' + i + '\n');
	console.log(out);
	output.dpcm = out;
}

const ftm_process_macros = (lines, i) => {
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
