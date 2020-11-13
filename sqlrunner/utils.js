function unpackObject(object, properties) {
    return properties.map(property => object[property]);
}

module.exports = {unpackObject};
