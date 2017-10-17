'use strict';



var new_url = '/';
self.addEventListener('push', function(event) {
  console.log('Received a push message', event);

  console.log(event);
  var title = 'Yay a message.';
  var body = 'We have received a push message.';
  var icon = '';
  var tag = 'simple-push-demo-notification-tag';

  self.registration.pushManager.getSubscription().then(function(subscription) {
      var mergedEndpoint = endpointWorkaround(subscription);
      var endpointSections = mergedEndpoint.split('/');
      var subscriptionId = endpointSections[endpointSections.length - 1];
      fetch('https://cur1ous.com/api/push/getpushmessage/?clientid'+subscriptionId, {
        method: 'get',
      })
      .then(function(response) { return response.json(); })
      .then(function(r) {
        var data = r.data[0];
        self.registration.showNotification(data.text, {
          body: data.url
        });
        new_url = data.url;
      })
      .catch(function(err) {
        console.log('err');
        console.log(err);
      });
    });
});

self.addEventListener('notificationclick', function(event) {
  console.log('On notification click: ', event.notification.tag);
  // Android doesn’t close the notification when you click on it
  // See: http://crbug.com/463146
  event.notification.close();

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(clients.matchAll({
    type: 'window'
  }).then(function(clientList) {
    for (var i = 0; i < clientList.length; i++) {
      var client = clientList[i];
      if (client.url === new_url && 'focus' in client) {
        return client.focus();
      }
    }
    if (clients.openWindow) {
      return clients.openWindow(new_url);
    }
  }));
});


function endpointWorkaround(pushSubscription) {
  // Make sure we only mess with GCM
  if (pushSubscription.endpoint.indexOf('https://android.googleapis.com/gcm/send') !== 0) {
    return pushSubscription.endpoint;
  }

  var mergedEndpoint = pushSubscription.endpoint;
  // Chrome 42 + 43 will not have the subscriptionId attached
  // to the endpoint.
  if (pushSubscription.subscriptionId &&
    pushSubscription.endpoint.indexOf(pushSubscription.subscriptionId) === -1) {
    // Handle version 42 where you have separate subId and Endpoint
    mergedEndpoint = pushSubscription.endpoint + '/' +
      pushSubscription.subscriptionId;
  }
  return mergedEndpoint;
}