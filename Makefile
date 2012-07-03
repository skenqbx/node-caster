#
# node-caster Makefile
# @author skenqbx@gmail.com (Malte-Thorben Bruns)
#
REPORTER ?= spec

all: jshint test

jshint:
	@node_modules/.bin/jshint lib/ index.js

test:
	@node_modules/.bin/mocha --reporter $(REPORTER) test/*.js

.PHONY: jshint test
