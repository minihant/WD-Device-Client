const chai = require('chai');
const chaiVerify = require('chai-verify');
const container = require('../container');
const sinon = require('sinon');

chai.use(chaiVerify);

const { assert } = chai;

describe("Get Config", function () {

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
            readFileSync: sinon.spy()
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

    it('reads a config from the filesystem if one is not in memory', function () {
        const configuratron = configuratronFactory.buildConfiguratron(configuratronOptions);

        configuratron.readConfig();

        assert.equal(fakeFs.readFileSync.callCount, 1);
    });

    it('does not read from the file system if config is in memory', function () {
        const configuratron = configuratronFactory.buildConfiguratron(configuratronOptions);

        configuratron.setConfig({});
        configuratron.getConfig();

        assert.equal(fakeFs.readFileSync.callCount, 0);
    });

    it('returns config from filesystem when it exists', function () {
        const configuratron = configuratronFactory.buildConfiguratron(configuratronOptions);

        const expectedConfig = { fromFileSystem: true }

        fakeFs.readFileSync = () => JSON.stringify(expectedConfig);

        const config = configuratron.getConfig();

        assert.equal(JSON.stringify(config), JSON.stringify(expectedConfig));
    });

    it('returns config from memory when it exists', function () {
        const configuratron = configuratronFactory.buildConfiguratron(configuratronOptions);

        const expectedConfig = { fromFileSystem: false }

        fakeFs.readFileSync = () => JSON.stringify({ fromFileSystem: true });

        configuratron.setConfig(expectedConfig);
        const config = configuratron.getConfig();

        assert.equal(JSON.stringify(config), JSON.stringify(expectedConfig));
    });

    it('properly stores config when read from fs', function () {
        const configuratron = configuratronFactory.buildConfiguratron(configuratronOptions);

        const expectedConfig = { fromFileSystem: true }

        fakeFs.readFileSync = () => JSON.stringify(expectedConfig);
        configuratron.getConfig();

        fakeFs.readFileSync = () => JSON.stringify(null);

        const config = configuratron.getConfig();

        assert.equal(JSON.stringify(config), JSON.stringify(expectedConfig));
    });

});