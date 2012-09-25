#
# node-caster Makefile
# @author skenqbx@gmail.com (Malte-Thorben Bruns)
#
REPORTER ?= list

all: jshint test
	@

jshint:
	@node_modules/.bin/jshint ./

test:
	@node_modules/.bin/mocha -R ${REPORTER}

test-cov: lib-cov
	@CASTER_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

lib-cov:
	@rm -rf lib-cov/
	@./node-jscoverage/jscoverage lib lib-cov

install: node_modules node-jscoverage
	@

node-jscoverage:
	@git clone git://github.com/visionmedia/node-jscoverage.git
	@cd node-jscoverage/ && ./configure && make

node_modules:
	@npm install

clean:
	@rm -rf node-jscoverage/
	@rm -rf node_modules/
	@rm -rf lib-cov/

.PHONY: jshint test lib-cov
