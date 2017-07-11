view.js: view.ts
	tsc $<

.PHONY: lint
lint: view.ts
	tslint $^

.PHONY: init
init:
	# download raw blessed type info from DT
	@if [ ! -e blessed.d.ts ]; then curl -o blessed.d.ts https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/types/blessed/index.d.ts; fi
	@make view.js
	@make lint
