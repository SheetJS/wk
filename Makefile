index.js: index.ts
	tsc $<

.PHONY: lint
lint: index.ts
	tslint $^

.PHONY: init
init:
	@make index.js
	@make lint

.PHONY: clean
clean:
	@rm -f index.js src/*.js
