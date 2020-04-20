function configReaderFactory(
    fs,
    logger,
    path
) {

    function buildConfigReader(basePath) {

        function displayConfigReadError(error) {
            logger.log(
                'An error occurred while reading' +
                'config file: ' + error.message +
                '\nUsing default configuration.'
            );
        }

        function readConfig(filePath) {
            const readPath = path.join(basePath, filePath);

            try {
                return fs.readFileSync(readPath, { encoding: 'utf8' });
            } catch (error) {
                displayConfigReadError(error);

                return {};
            }
        }

        return {
            readConfig
        };
    }

    return {
        buildConfigReader
    };
}

module.exports = configReaderFactory;