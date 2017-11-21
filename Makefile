
all: dvidump.js render-dvi.js

dvidump.js: dvidump.es6.js
	babel $< > $@

render-dvi.js: render-dvi.es6.js
	babel $< > $@
