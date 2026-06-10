import "@testing-library/jest-dom";

// JSDOM does not implement scrollIntoView — stub it out globally
window.HTMLElement.prototype.scrollIntoView = () => {};
