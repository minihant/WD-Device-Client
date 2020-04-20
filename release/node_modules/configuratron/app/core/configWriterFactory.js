function configWriterFactory(
    fs,
    path
) {

    function buildConfigWriter(basePath) {
        function writeConfig(filePath, fileContent) {
            const writePath = path.join(basePath, filePath);

            fs.writeFileSync(writePath, fileContent);
        }

        return {
            writeConfig
        };
    }

    return {
        buildConfigWriter
    };

}

module.exports = configWriterFactory;