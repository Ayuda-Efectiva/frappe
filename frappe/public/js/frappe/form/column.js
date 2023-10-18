export default class Column {
	constructor(section, df) {
		if (!df) df = {};

		this.df = df;
		this.section = section;
		this.make();
		this.resize_all_columns();
	}

	make() {
		// DFP Allow hidden columns (mainly when customizing docs)
		// this.wrapper = $('<div class="form-column">\
		// 	<form>\
		// 	</form>\
		// </div>').appendTo(this.section.body)
		this.wrapper = $(`<div class="form-column${(this.df.hidden?' hidden':'')}">`
			+'<form></form></div>')
			.appendTo(this.section.body)
			.find("form")
			.on("submit", function () {
				return false;
			});

		if (this.df.label) {
			$(`
				<label class="control-label">
					${__(this.df.label)}
				</label>
			`).appendTo(this.wrapper);
		}
	}

	resize_all_columns() {
		// distribute all columns equally

		// DFP Allow hidden columns (when customizing doctypes and you want to hide any field)
		// let columns = this.section.wrapper.find(".form-column").length;
		let columns = this.section.wrapper.find(".form-column:not(.hidden)").length;
		let colspan = cint(12 / columns);

		if (columns == 5) {
			colspan = 20;
		}

		this.section.wrapper
			.find(".form-column")
			.removeClass()
			.addClass("form-column")
			.addClass("col-sm-" + colspan);
	}

	refresh() {
		this.section.refresh();
	}
}
