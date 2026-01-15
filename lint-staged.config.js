export default {
	"*.{js,jsx,ts,tsx}": (filenames) => {
		let files = filenames.join(" ")
		return [`oxlint ${files} --fix`, `oxfmt ${files}`]
	},
}
