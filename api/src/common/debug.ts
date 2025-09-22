export const DEBUG_ENABLED = !!process.env.DEBUG;
export const debug = (...args: any[]) => {
  if (DEBUG_ENABLED) {
    console.log(...args);
  }
};
