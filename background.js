// Add event listeners
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('REQUEST', request.method, request);
  if (request.method == "getAllLocalStorage") {
    chrome.storage.local.get(null, function(items) {
      sendResponse({data: items});
    });
    return true; // Indicates asynchronous response
  }
  else if (request.method == "getLocalStorage") {
    chrome.storage.local.get(request.key, function(items) {
      sendResponse({data: items[request.key]});
    });
    return true; // Indicates asynchronous response
  }
  else if (request.method == "setLocalStorage") {
    let newObject = {};
    newObject[request.key] = request.value;
    chrome.storage.local.set(newObject, function() {
      sendResponse({});
    });
    return true; // Indicates asynchronous response
  }
  else if (request.method == "getUserData") {
    // getUserData will now handle sendResponse asynchronously
    getUserData(request.usernames, sendResponse);
    return true; // Indicates asynchronous response
  }
  else {
    sendResponse({});
    // return false; // or omit return, as it's synchronous by default if nothing else returns true.
                  // However, to be safe and explicit given other branches are async:
    return false; // Explicitly stating it's synchronous or no response needed from this path.
  }
});

function getUserData(usernames, callback) {
  chrome.storage.local.get(usernames, function(items) {
    // Note: 'items' will contain an object with the keys requested in 'usernames'
    // and their corresponding values. If a key is not found, it won't be in 'items'.
    // This behavior is different from localStorage which would return `undefined`.
    // The original function would assign `undefined` for missing keys.
    // We will replicate this behavior for consistency.
    var results = {};
    for (var i = 0; i < usernames.length; i++) {
      var key = usernames[i];
      results[key] = items[key]; // Will be undefined if not in items, which is fine.
    }
    if (callback) {
      callback({ data: results });
    }
  });
}

//expire old entries
(function() {
  chrome.storage.local.get(null, function(items) {
    var now = new Date().getTime();
    for (const key in items) {
      if (items.hasOwnProperty(key)) {
        try {
          var info = JSON.parse(items[key]);
          // Check if info has an expire property
          if (info && info.expire && now > info.expire) {
            chrome.storage.local.remove(key, function() {
              if (chrome.runtime.lastError) {
                console.error("Error removing item " + key + ": " + chrome.runtime.lastError.message);
              } else {
                console.log("Removed expired item: " + key);
              }
            });
          }
        } catch (e) {
          // If it's not a JSON string or doesn't have 'expire', we might not want to remove it,
          // or handle it differently. For now, just log error if it's not parseable.
          // console.error("Could not parse item " + key + ": " + items[key], e);
          // Depending on requirements, non-JSON or non-expiring items might be ignored or handled.
          // The original code would fail on JSON.parse and stop. This is more robust.
        }
      }
    }
  });
})();
