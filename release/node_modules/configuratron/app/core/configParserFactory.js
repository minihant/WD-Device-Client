function configParserFactory(
    typeHelper
) {

    const { isString } = typeHelper;

    function buildConfigParser(parse) {

        function parseConfiguration(configurationValue) {
            return isString(configurationValue)
                ? parse(configurationValue)
                : {};
        }

        return {
            parseConfiguration
        }

    }

    return {
        buildConfigParser
    };
}

module.exports = configParserFactory;
