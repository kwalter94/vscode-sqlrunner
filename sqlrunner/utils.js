const { hrtime } = require('process');

const NANOS_PER_SECOND = 1_000_000_000;

function unpackObject(object, properties) {
    return properties.map(property => object[property]);
}

function nanosToSeconds(nanos) {
    return Number(nanos) / NANOS_PER_SECOND;
}

/**
 * Time the execution of an async operation.
 * 
 * @param {() => Promise} operation 
 */
async function timeIt(operation) {
    const startTime = hrtime.bigint();
    const result = await operation();
    const endTime = hrtime.bigint();

    return [nanosToSeconds(endTime - startTime), result];
}

module.exports = { timeIt, unpackObject };
