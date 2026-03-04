// src/network/FXMLHttpRequest.js — XHR-like API that sends via our Network (async callback)

// Drop-in XHR interface that routes requests through the simulated Network instead of the browser.
export class FXMLHttpRequest {
  // Stores the network reference and initialises default request state.
  constructor(network) {
    this.network = network;
    this.method = null;
    this.url = null;
    this.to = null;
    this.status = 0;
    this.responseText = "";
    this.readyState = 0;
    this.onload = null;
    this.onerror = null;
  }

  // Sets method, URL, and target address; must be called before send.
  open(method, url, toAddress) {
    this.method = method.toUpperCase();
    this.url = url;
    this.to = toAddress;
    this.readyState = 1;
  }

  // Dispatches the request and calls onload or onerror when the network responds.
  send(bodyObj = null) {
    const req = {
      to: this.to,
      method: this.method,
      url: this.url,
      body: bodyObj,
    };

    this.readyState = 2;

    this.network.send(req, (res) => {
      this.status = res.status;
      this.responseText = JSON.stringify(res);
      this.readyState = 4;

      if (res.ok) {
        this.onload && this.onload();
      } else {
        this.onerror && this.onerror();
      }
    });
  }
}
