var azure = require('azure-sb');

var queueName = 'sbqtest';

const processMessage = sbService => msg => new Promise((resolve, reject) => {
    // read/process message
    console.log('Rx: ', msg.body);

    // delete it
    sbService.deleteMessage(msg, (e) => {
        if (e) return reject(e)
        console.log('deleted: ', msg.body)
        return resolve();
    })
})

const checkForMessages = (sbService) => new Promise((resolve, reject) => {
    sbService.receiveQueueMessage(queueName, { isPeekLock: true }, (err, lockedMessage) => {
        if (err) {
            if (err == 'No messages to receive') return resolve([]);
            else return reject(err);
        }
        return resolve([lockedMessage]);
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
        console.log('check message every 1s')
        const processor = processMessage(sbService);

        const worker = () => {
            checkForMessages(sbService)
                .then(messages => {
                    console.log('message count: ' + messages.length);
                    return messages
                })
                .then(messages => Promise.all(messages.map(processor)))
                .then(() => setTimeout(worker, 100)) // recursive
                .catch(console.error)
        };
        worker();
    }
});
