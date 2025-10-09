export const DEBUG_ENABLED = true;
export const logger = (...args: any[]) => {
  if (DEBUG_ENABLED) {
    console.log(...args);
  }
};
