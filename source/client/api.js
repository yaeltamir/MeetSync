// src/client/api.js
import { Network } from "../network/Network.js";
import { FXMLHttpRequest } from "../network/FXMLHttpRequest.js";
import { AuthServer } from "../server/AuthServer.js";
import { MeetingsServer } from "../server/MeetingsServer.js";

export const ADDR_AUTH = "server://auth";
export const ADDR_MEETINGS = "server://meetings";

export const network = new Network({
  dropRate: 0.2,      // change between 0.1 and 0.5 if you want
  minDelayMs: 1000,
  maxDelayMs: 3000,
});

network.register(ADDR_AUTH, (req) => AuthServer.handle(req));
network.register(ADDR_MEETINGS, (req) => MeetingsServer.handle(req));

export function fajax() {
  return new FXMLHttpRequest(network);
}

export function parseResponseText(xhr) {
  return JSON.parse(xhr.responseText);
}

/**
 * Retry wrapper:
 * - retries ONLY on status 503 (network drop simulation)
 * - does NOT retry on real server errors (401/400/404/500)
 */
export function sendWithRetry({ method, url, to, body, retries = 2 }, handlers) {
  const { onOk, onFail, onAttempt } = handlers;

  const attempt = (triesLeft) => {
    onAttempt && onAttempt(triesLeft);

    const xhr = fajax();
    xhr.onload = () => onOk(parseResponseText(xhr));
    xhr.onerror = () => {
      const res = parseResponseText(xhr);

      if (res.status === 503 && triesLeft > 0) {
        attempt(triesLeft - 1);
        return;
      }
      onFail(res);
    };

    xhr.open(method, url, to);
    xhr.send(body);
  };

  attempt(retries);
}
