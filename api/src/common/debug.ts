export const DEBUG_ENABLED = true;
export const debug = (...args: any[]) => {
  if (DEBUG_ENABLED) {
    console.log(...args);
  }
};
