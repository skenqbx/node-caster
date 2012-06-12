#
# node-caster Makefile
# @author malte.bruns@joocom.de (Malte-Thorben Bruns)
#
all:
	@

jshint:
	@node_modules/.bin/jshint lib/ index.js

test:
	@node test.js
