// Preserve the three authoritative source stylesheets while omitting demo-only
// selectors from the stylesheet served by the production application.
const removePrototypeStyles = () => ({
  postcssPlugin: 'ql-remove-prototype-styles',
  Rule(rule) {
    if (/\.qs-(?:doc|proto-bar)(?![\w-])/.test(rule.selector)) rule.remove();
  }
});
removePrototypeStyles.postcss = true;
const config = { plugins: [removePrototypeStyles] };
export default config;
