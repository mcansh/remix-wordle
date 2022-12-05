module.exports = {
  "*.{js,jsx,ts,tsx}": (filenames) => {
    let files = filenames.join(" ");
    return [`eslint ${files} --fix`, `prettier ${files} --write`];
  },
};
