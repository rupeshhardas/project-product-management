const mongoose = require("mongoose")




const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false //it checks whether the string contain only space or not 
    return true;
};
const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}
const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0;
};

const isValidstatus = function (value) {
    return ["pending", "completed", "cancled"].indexOf(value) !== -1
}

//only check empty string value.
const validString = function (value) {
    if (typeof value === 'string' && value.trim().length === 0) return false //it checks whether the string contain only space or not 
    return true;
}

const isValidNumber = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (isNaN(value) && value.toString().trim().length !== 0) return false

    return true;
}
module.exports = { isValid, isValidObjectId, isValidRequestBody, isValidstatus, validString, isValidNumber }