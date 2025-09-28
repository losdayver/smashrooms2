export const urlParams = Object.fromEntries(
  new URLSearchParams(window.location.search).entries()
);
