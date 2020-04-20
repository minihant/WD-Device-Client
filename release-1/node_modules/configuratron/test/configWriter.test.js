const chai = require('chai');
const chaiVerify = require('chai-verify');
const container = require('../container');
const sinon = require('sinon');

chai.use(chaiVerify);

const { assert } = chai;

describe("Write Configuration", function () {
    let childContainer;
    let configuratronFactory;
    let configuratronOptions;
    let fakeFs;
    let fakePath;

    beforeEach(function () {
        childContainer = container.new();

        configuratronOptions = {
            basePath: '/path/to/config/',
            defaultConfig: {},
            filePath: './myconfig.json'
        };


        fakeFs = {
            existsSync: () => true,
            writeFileSync: sinon.stub()
        };

        fakeProcess = {
            cwd: () => '/cwd/path'
        };

        fakePath = {
            join: (...args) => args.join('{fakeJoin}')
        };

        childContainer.register(() => fakeFs, 'fs');
        childContainer.register(() => fakePath, 'path');
        childContainer.register(() => fakeProcess, 'process');

        configuratronFactory = childContainer.build('configuratronFactory');
    });

    describe("writeConfig", function () {

        it('writes a file a path joined to a base path', function () {
            const basePath = configuratronOptions.basePath;
            const filePath = configuratronOptions.filePath;

            configuratronOptions.serializer = value => value;
            const configuratron = configuratronFactory
                .buildConfiguratron(configuratronOptions);

            const fileContent = 'this is data';
            configuratron.setConfig(fileContent);

            configuratron.writeConfig();

            const expectedWritePath = fakePath.join(basePath, filePath);
            const actualWritePath = fakeFs.writeFileSync.getCall(0).args[0];
            const actualFileContent = fakeFs.writeFileSync.getCall(0).args[1];

            assert.equal(actualWritePath, expectedWritePath);
            assert.equal(actualFileContent, fileContent);
        });

        it('accepts an optional serializer function', function () {
            const serializer = (data) => JSON.stringify(data) + 'foo';

            configuratronOptions.serializer = serializer;
            const configuratron = configuratronFactory
                .buildConfiguratron(configuratronOptions);

            const fileContent = ['this is data'];
            configuratron.setConfig(fileContent);

            configuratron.writeConfig();

            const expectedContent = JSON.stringify(fileContent) + 'foo';
            const actualContent = fakeFs.writeFileSync.getCall(0).args[1];

            assert.equal(actualContent, expectedContent);
        });

    });

});