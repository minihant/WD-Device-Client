# Configuratron #

Configuratron is a cybernetic JavaScript software implant designed to simplify the process of creating, storing, retrieving, and modifying configuration files. Rather than building a bunch of file and merge logic into the core of your application, Configuratron makes it easy to set it and forget it.

## Installation ##

Use npm to install Configuratron:

`npm i configuratron`

## Usage ##

Configuratron is built to be simple to use and integrate. By default, Configuratron is designed to read and write to the current working directory, and read/write JSON.  Below is an example of the most common usage:

```javascript
const configuratron = require('configuratron')
    .buildConfiguratron({ filePath: 'myConfig.json' });

let currentConfig = configuratron.getConfig();

currentConfig.changedProperty = 'New Value';

configuratron.setConfig(currentConfig);

configuratron.writeConfig();
```

Configuratron keeps the config read from the disk in memory in case you need to update it, or read it again. This limits the number of returns to the disk and makes it easier to share any in-application configuration changes across modules without complicating the flow by passing your configuration from file to file.

## All Options ##

Configuratron has a number of options which can be set at build time:

- `basePath` [optional, string] -- default is process.cwd(), any valid path can be provided

- `filePath` [required, string] -- the path to your configuration file

- `serializer` [optional, function] -- default is JSON.stringify. The serializer may be important if you want to write values to package.json, or if you want to write a file format other than JSON.

- `parser` [optional, function] -- default is JSON.parse. The parser may be important if you are reading data from package.json or reading from a file format other than JSON.

- `defaultConfig` [optional, function] -- default options are merged into the configuration file at read time and at write time.  This guarantees you always have sane defaults for you configuration, and helps with legacy configuration files which might be missing new options.

## Full API ##

- `getConfig` -- reads configuration from memory when available, otherwise loads config from the filesystem. Stores configuration in memory

- `setConfig` -- updates configuration options stored in memory. If no options have been loaded, yet, setConfig will initialize the in-memory configuration

- `readConfig` -- reads configuration directly from filesystem. Does not store configuration in memory

- `writeConfig` -- writes configuration stored in memory to the filesystem