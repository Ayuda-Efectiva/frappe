const path = require("path");
const fs = require("fs");
const glob = require("fast-glob");

module.exports = {
	name: "build_cleanup",
	setup(build) {
		build.onEnd((result) => {
			if (result.errors.length) return;
			clean_dist_files(Object.keys(result.metafile.outputs));
		});
	},
};

function clean_dist_files(new_files) {
	// DFP Cleanup dist files but leaving latest x previous versions
	dfp_clean_dist_files_leaving_latest_x_previous_versions(new_files);
	return
	new_files.forEach((file) => {
		if (file.endsWith(".map")) return;

		const pattern = file.split(".").slice(0, -2).join(".") + "*";
		glob.sync(pattern).forEach((file_to_delete) => {
			if (file_to_delete.startsWith(file)) return;

			fs.unlink(path.resolve(file_to_delete), (err) => {
				if (!err) return;

				console.error(`Error deleting ${file.split(path.sep).pop()}`);
			});
		});
	});
}

// <DFP
/**
 * Avoid all assets being removed and keep last defined versions. Using docker to build images, we need to keep last x previous versions of assets to allow smooth deploy if severtal instances are running at the same time because for a short time, some instances will be running old code and some new code
 */
function dfp_clean_dist_files_leaving_latest_x_previous_versions(new_files, versions_to_keep=5) {
	// Group files by their base name and extension (without hash)
	const fileGroups = new Map();

	new_files.forEach((file) => {
		if (file.endsWith(".map")) return;
		const pattern = file.split(".").slice(0, -2).join(".") + "*";
		const files = glob.sync(pattern);
		// Get base name without hash and final extension
		const parts = file.split(".");
		const extension = parts.pop();
		const baseName = parts.slice(0, -1).join(".") + "." + extension;
		if (!fileGroups.has(baseName)) {
			// Filter files to only include those with the same extension
			const sameExtFiles = files.filter(f => f.endsWith("." + extension) || f.endsWith("." + extension + ".map"));
			fileGroups.set(baseName, sameExtFiles);
		}
	});

	fileGroups.forEach((files, baseName) => {
		// Sort files by creation time, newest first
		files.sort((a, b) => {
			return fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime();
		});
		const filesToDelete = files.slice(versions_to_keep);
		filesToDelete.forEach((file_to_delete) => {
			fs.unlink(path.resolve(file_to_delete), (err) => {
				if (!err) {
					console.log(`DFP: Deleted old version: ${file_to_delete.split(path.sep).pop()}`);
					return;
				}
				console.error(`DFP: Error deleting ${file_to_delete.split(path.sep).pop()}`);
			});
		});
	});
}
// DFP>
