function logger () {

    return {
        log: (...args) => console.log(...args)
    };
}

module.exports = logger;