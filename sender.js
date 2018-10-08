var azure = require('azure-sb');

var idx = 0;
var queueName = 'sbqtest';

const sendMessages = (sb) => new Promise((resolve, reject) => {
    var msg = 'Message #' + (++idx);
    sbService.sendQueueMessage(queueName, msg, function(err) {
        if (err) return reject(err)
        return resolve(msg)
    });
})

var connStr = process.argv[2] || process.env.CONNECTION_STRING;
if (!connStr)
    throw new Error('Must provide connection string');

console.log('Connecting to ' + connStr);
console.log('Queue Name: ' + queueName);

var sbService = azure.createServiceBusService(connStr);
sbService.createQueueIfNotExists(queueName, (err) => {
    if (err) {
        console.log('Failed to create queue: ', err);
    } else {
        console.log('Send message every 1s')
        const sendEvery = () => {
            sendMessages(sbService)
                .then(msg => console.log('sent:', msg))
                .then(() => setTimeout(sendEvery, 100))
        };
        sendEvery();
    }
});
