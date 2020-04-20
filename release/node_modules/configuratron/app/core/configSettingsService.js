function configSettingsService(
    typeHelper
) {

    function mergeConfigSettings(
        configSettings,
        defaultConfig = {}
    ) {
        function isSettingUndefined(key) {
            const configValue = configSettings[key];

            return typeHelper.isUndefined(configValue);
        }

        function assignDefaultValue(settings, key) {
            settings[key] = defaultConfig[key];
            return settings;
        }

        return Object
            .keys(defaultConfig)
            .filter(isSettingUndefined)
            .reduce(assignDefaultValue, configSettings);
    }

    return {
        mergeConfigSettings
    };
}

module.exports = configSettingsService;