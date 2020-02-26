export function center_str(s: string, w: number): string {
	if(s.length >= w) return s.substr(0,w);
	const pl = (w - s.length) >> 1;
	return new Array(pl+1).join(" ") + s + new Array(w - s.length - pl + 1).join(" ");
}

export function right_str(s: string, w: number): string {
	if(s.length >= w) return s.substr(0, w);
	const l = (w - s.length);
	return new Array(l+1).join(" ") + s;
}

export function left_str(s: string, w: number): string {
	if(s.length >= w) return s.substr(0, w);
	const l = (w - s.length);
	return s + new Array(l+1).join(" ");
}
