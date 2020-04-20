function configSerializerFactory () {
    

    function buildConfigurationSerializer(serialize) {

        function serializeConfiguration(configuration) {
            return serialize(configuration);
        }

        return {
            serializeConfiguration
        };
    }

    return {
        buildConfigSerializer: buildConfigurationSerializer
    };
}

module.exports = configSerializerFactory;