function configLocator (
    fs,
    path,
    process
) {
    
    function findReadPath({
        basePath = process.cwd(),
        filePaths
    }) {
        return filePaths
            .find(function (filePath) {
                const fullPath = path.join(basePath, filePath);

                return fs.existsSync(fullPath);
            });
    }

    return {
        findReadPath
    };
}

module.exports = configLocator;