import ForkQueue from '../../src/ForkQueue';

// Initialize ForkQueue
const queue = new ForkQueue({
  processFilePath: `${__dirname}/ChildProcess.js`,
  maxPoolSize: 5,
  minPoolSize: 2,
  idleTimeoutMillis: 30000,
});

queue.saturated(() => {
  console.debug(
    'Fork.queue is busy in processing. Incoming messages will be put to queue. Queue status [waiting: %s, running: %s]',
    queue.length(),
    queue.running(),
  );
});

queue.unsaturated(() => {
  console.debug(
    'Fork.queue is available for processing more messages. Queue status [waiting: %s, running: %s]',
    queue.length(),
    queue.running(),
  );
});

queue.drain(() => {
  console.debug('All messages in fork.queue have been successfully processed. Waiting for new message...');
});

// Start testing
console.debug('START pushing messages to queue for concurrency processing');

for (let idx = 0; idx < 10; idx++) {
  const message = { content: 'Just dummy message ' + idx };

  const callback = (response) =>
    console.info(
      'Message %s has been successfully processed. Result: %s',
      JSON.stringify(message),
      JSON.stringify(response),
    );

  // Push messages to queue for concurrency processing
  queue.push(message, callback);
}
