# Famitracker Text Export to NES Code
We're in the real early phase right now. I need this tool for projects. 

## Usage
- Use whatever version of Famitracker has the File > Export > Text... feature available. 
- Open ftm2dasm.html in your browser of choice. 
- Drag & Drop the exported text file into that same browser tab.
At first I thought cli php would be a good interface. Then I thought maybe a compilable cli c solution would be better. But then I thought, "Everyone has a browser!"

## Supported Famitracker Features
Coming soon!

## Limitations
Max Song Length: 51 (255 / 5 channels)
Max Macros: 
Max Channel Patterns: 254 (0xFF empty pattern)

## Current Targeted Features
- 150 tempo locked
- pattern volume column
- 1xx 2xx 4xx Fxx Pxx Sxx Vxx
- instrument volume + duty envelopes
- sfx priority (end with C00 or E00)
