function format (str, args) {
	if(str==undefined) return str;

	this.unkeyed_index = 0;
	return str.replace(/\{(\w*)\}/g, function(match, key) {

		if (key === '') {
			key = this.unkeyed_index;
			this.unkeyed_index++
		}
		if (key == +key) {
			return args[key] !== undefined
				? args[key]
				: match;
		}
	}.bind(this));
}

// DFP. avoid error if jQuery is not defined (it happens :)
// if (jQuery) {
if (typeof jQuery != 'undefined') {
	jQuery.format = format
}
