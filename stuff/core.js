
const notes = [ 'C-', 'C#', 'D-', 'D#', 'E-', 'F-' ,'F#', 'G-' ,'G#', 'A-', 'A#', 'B' ];
const tohex = (x) => x.toString(16).padStart(2, '0'); 

let output;
let data = {};
let track = [];
let track_id = -1;

window.addEventListener("DOMContentLoaded", () => {
	const cont = document.getElementById("containment");
	const droptarg = document;
	const domp = new DOMParser();
	const br = "<br>";
	outtarg = document.getElementById("output");
	// drop handler
	droptarg.addEventListener("drop", (e) => {
		e.preventDefault();
		cont.classList.remove("dragover");
		output = {};
		outtarg.innerHTML = '';
		track_id = -1;
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
