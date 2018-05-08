import browser from "webextension-polyfill";

export function sendMessage(payload) {
  return getId().then(id => (
    browser.runtime.sendMessage(id, payload)
  ));
}

function getId() {
  return browser.storage.local.get(["seideId"]).then(results => (
    results.seideId ? results.seideId : process.env.SIDE_ID
  ));
}

let interval;

export function startPolling(payload, cb) {
  interval = setInterval(() => {
    sendMessage({
      uri: "/health",
      verb: "get"
    }).catch(res => ({error: res.message})).then(res => {
      if (!res) {
        sendMessage({
          uri: "/register",
          verb: "post",
          payload
        }).then(() => {
          console.log("registered");
          cb();
        });
      } else if (res.error) {
        cb(new Error(res.error));
      }
    });
  }, 1000);
}

export function stopPolling() {
  clearInterval(interval);
}
