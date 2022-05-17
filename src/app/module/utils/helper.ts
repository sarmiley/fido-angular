function removeEmpty(obj: any): void {
  for (let key in obj) {
    if (obj[key] == null || obj[key] === '') {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      removeEmpty(obj[key]);
    }
  }
}

/**
 * Base64 url decode
 * @param {String} base64url
 */
function base64UrlDecode(base64url: any) {
  let input = base64url.replace(/-/g, '+').replace(/_/g, '/');
  let diff = input.length % 4;
  if (!diff) {
    while (diff) {
      input += '=';
      diff--;
    }
  }

  return Uint8Array.from(atob(input), (c) => c.charCodeAt(0));
}

function base64UrlEncode(arrayBuffer: any = '') {
  if (!arrayBuffer || arrayBuffer.length == 0) {
    return undefined;
  }

  return btoa(
    String.fromCharCode.apply(null, new Uint8Array(arrayBuffer) as any)
  )
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function logObject(name: any, object: any): void {
  console.log(name + ': ' + JSON.stringify(object));
}

function logVariable(name: any, text: any) {
  console.log(name + ': ' + text);
}

export {
  removeEmpty,
  base64UrlDecode,
  base64UrlEncode,
  logObject,
  logVariable
}
