const chai = require('chai');
const chaiVerify = require('chai-verify');
const container = require('../container');
const sinon = require('sinon');

chai.use(chaiVerify);

const { assert } = chai;

describe("Read Config", function () {

    let childContainer;
    let configuratronFactory;
    let configuratronOptions;
    let fakeFs;
    let fakePath;
    let fakeLogger;

    beforeEach(function () {
        childContainer = container.new();

        configuratronOptions = {
            basePath: '/base/path/',
            defaultConfig: {},
            filePath: 'myconfig.json'
        };

        fakeFs = {
            existsSync: () => true
        };

        fakeLogger = {
            log: sinon.stub()
        };

        fakePath = {
            join: (...args) => args.join('{fakeJoin}')
        }

        fakeProcess = {
            cwd: () => '',
        };

        childContainer.register(() => fakeFs, 'fs');
        childContainer.register(() => fakeLogger, 'logger');
        childContainer.register(() => fakePath, 'path');
        childContainer.register(() => fakeProcess, 'process');

        configuratronFactory = childContainer.build('configuratronFactory');
    });

    it('reads a config from the filesystem', function () {
        const configuratron = configuratronFactory.buildConfiguratron(configuratronOptions);

        const expectedConfig = { test: 'config' };
        const expectedPath = fakePath.join(
            configuratronOptions.basePath,
            configuratronOptions.filePath
        )

        fakeFs.readFileSync = sinon.spy(() => {
            return JSON.stringify(expectedConfig);
        });

        const capturedConfig = configuratron.readConfig();

        function ensureCallIsCorrectAndEncodingIsNotForgotten() {
            assert.equal(fakeFs.readFileSync.getCall(0).args[0], expectedPath);
            assert.equal(fakeFs.readFileSync.getCall(0).args[1].encoding, 'utf8');
        }

        ensureCallIsCorrectAndEncodingIsNotForgotten();

        assert.verify(capturedConfig, expectedConfig);
    });

    it('supports optional source parser', function () {
        function parser(configString) {
            const config = JSON.parse(configString);

            return config.test;
        }

        configuratronOptions.parser = parser;
        const configuratron = configuratronFactory.buildConfiguratron(configuratronOptions);

        const expectedConfig = { test: 'config' };


        fakeFs.readFileSync = sinon.spy(function (filePath) {
            return JSON.stringify(expectedConfig);
        });

        const configData = configuratron.readConfig();

        assert.equal(configData, expectedConfig.test);
    });

    it('returns an empty object when a config file cannot be read', function () {
        const configuratron = configuratronFactory.buildConfiguratron(configuratronOptions);

        fakeFs.readFileSync = () => null;

        const returnedConfig = configuratron.readConfig();

        assert.verify(returnedConfig, {});
    });

    it('warns user when config cannot be read', function () {
        const configuratron = configuratronFactory.buildConfiguratron(configuratronOptions);

        fakeFs.readFileSync = () => { throw new Error('Oh noes!'); };

        configuratron.readConfig();

        const expectedError = 'An error occurred while reading' +
        'config file: Oh noes!' +
        '\nUsing default configuration.'

        const actualError = fakeLogger.log.getCall(0).args[0];

        assert.equal(actualError, expectedError);
    });

});