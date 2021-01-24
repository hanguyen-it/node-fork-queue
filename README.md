# Generic Pool

## About

  A queue for node.js that uses child processes (child_process.fork()). This queue uses Pools for child-process because it takes time to spawn new child-process. Can be used to reuse or throttle usage of expensive resources such as image processing or video rendering.

## Installation

```sh
$ npm install node-fork-queue [--save]
```


## Example

### Create MainProcess.js as follows:

```js
const { ForkQueue } = require('node-fork-queue');

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
console.debug('START pushing messages to queue for concurrency processing')

for(let idx = 0; idx < 10; idx++) {

  const message = {content: 'Just dummy message ' + idx};

  const callback = (response) => console.info(
                'Message %s has been successfully processed. Result: %s',
                JSON.stringify(message),
                JSON.stringify(response)
              );

  // Push messages to queue for concurrency processing  
  queue.push(message, callback);
}
```

### Create ChildProcess.js as follows (same folder with MainProcess.js):
```js
const idx = Math.floor(Math.random() * 51); // Random integer from 0 to 50
const times = [100, 150, 250, 300, 450, 500, 600, 700, 800, 900, 1000];

/**
 * Receive message from main-process and process it
 */
process.on('message', async (message) => {
  console.info('Process message %s', JSON.stringify(message));

  const response = await longRunTask();
  // Send response back to main-process
  process.send(response);
});

const longRunTask = async () => {
  try {
    
    await wait(times[idx % times.length]);

    if (idx %12 === 0) {
      throw new Error('Just random error');
    }

    return { value: { status: 'OK' }};

  } catch(err) {
    return { value: { status: 'ERROR' }, error: {message: err.message}};
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
```

## Documentation

## Run Tests

    $ npm install
    $ npm test

## Linting

We use eslint combined with prettier


## License

(The MIT License)

Copyright (c) 2021-2021 Ha Nguyen &lt;havietnguyen.it@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.