let isDebug = false;

export function enable() {
  isDebug = true;
}

export function disable() {
  isDebug = false;
}

export function debug(msg) {
  if (isDebug) console.debug(msg);
}

export function info(msg) {
  if (isDebug) console.info(msg);
}

export function log(msg) {
  if (isDebug) console.log(msg);
}

export function warn(msg) {
  if (isDebug) console.warn(msg);
}

export function error(msg) {
  if (isDebug) console.error(msg);
}

