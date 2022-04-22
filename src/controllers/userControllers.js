const userModel = require("../models/userModel")
const jwt = require("jsonwebtoken")
const bcrypt = require('bcrypt')
const aws = require("../aws")
const validator = require("../utils/validator")



const registerUser = async function (req, res) {
    try {
        files = req.files

        data = req.body

        if (Object.keys(req.body) == 0) {
            return res.status(400).send({ status: false, msg: "data is missing" })
        }

        let { fname, lname, email, phone, password, address } = data

        const req0 = validator.isValid(fname)
        if (!req0) { return res.status(400).send("fname is required") }

        const req1 = validator.isValid(lname)
        if (!req1) { return res.status(400).send("lname is required") }

        const req2 = validator.isValid(email)
        if (!req2) { return res.status(400).send("email is required") }

        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
            return res.status(400).send("email is invalid")
        }

        const findemail = await userModel.findOne({ email: email })
        if (findemail) { return res.status(200).send({ status: false, mgs: "email already exist" }) }

        if (files && files.length > 0) {
            data['profileImage'] = await aws.uploadFile(files[0])
        } else {
            return res.status(400).send({ status: false, message: "please provide profile pic " })
        }



        const req4 = validator.isValid(phone)
        if (!req4) { return res.status(400).send("phone is required") }

        if (!(/^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/.test(phone))) {
            return res.status(400).send("phone is invalid")
        }

        const req5 = validator.isValid(password)
        if (!req5) { return res.status(400).send("password is required") }

        if (password.length < 8 || password.length > 15) {
            return res.status(400).send({ status: false, msg: "password should be between 8 to 15" })
        }

        const findphone = await userModel.findOne({ phone: phone })
        if (findphone) { return res.status(200).send({ status: false, mgs: "phone is alredy exist" }) }

        if (!validator.isValid(address.shipping.street)) {
            return res.status(400).send({ status: false, msg: "street is required" })
        }


        if (!validator.isValid(address.shipping.city)) {
            return res.status(400).send({ status: false, msg: "city is required" })
        }


        if (!validator.isValid(address.shipping.pincode)) {
            return res.status(400).send({ status: false, msg: "pincode is required" })
        }


        if (!validator.isValid(address.billing.street)) {
            return res.status(400).send({ status: false, msg: "street is required" })
        }


        if (!validator.isValid(address.billing.city)) {
            return res.status(400).send({ status: false, msg: "city is required" })
        }


        if (!validator.isValid(address.billing.pincode)) {
            return res.status(400).send({ status: false, msg: "pincode2 is required" })
        }

        const createuser = await userModel.create(data)
        res.status(201).send({ status: true, msg: "User created successfully", data: createuser })

    }
    catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }

}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


const userLogin = async function (req, res) {
    try {
        const loginBody = req.body
        if (!loginBody) {
            return res.status(400).send({ status: false, message: 'Please Provide Login Details' })
        }

        const { email, password } = loginBody

        if (!email) {
            return res.status(400).send({ status: false, message: 'Please Provide Email' })
        }

        if (!password) {
            return res.status(400).send({ status: false, message: 'Please Provide Password' })
        }

        const emailExist = await userModel.findOne({ email: email })

        if (!emailExist) {
            return res.status(404).send({ status: false, message: `${email} not register` })
        }

        const match = await bcrypt.compare(password, emailExist.password)

        if (match) {

            let token = jwt.sign(
                {
                    userId: emailExist._id.toString(),
                    iat: Math.floor(Date.now() / 1000),
                    exp: Math.floor(Date.now() / 1000) + 1 * 60 * 60
                },
                'Products-Management')
            // {expiresIn:"60m"})

            res.setHeader("x-api-key", token);
            res.status(200).send({ status: true, message: 'Success', userId: emailExist._id, Token: token });
        } else {
            return res.status(404).send({ status: false, message: `${password} not valid` })

        }
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



const getauseradetails = async function (req, res) {
    try {

        userid = req.params.userId

        if (!(/^[0-9a-fA-F]{24}$/.test(userid))) {
            return res.status(400).send({ status: false, message: 'please provide valid userId' })
        }

        const findUser = await userModel.findById(userid)
        if (!findUser) return res.status(404).send({ status: false, msg: "user deatils not found" })

        res.status(200).send({ status: true, msg: "user Profile details details ", data: findUser })
    }
    catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }


}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



const updateUser = async (req, res) => {
    try {
        let files = req.files
        let requestBody = req.body
        let userId = req.params.userId



        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: `${userId} is not a valid user id` })

        }

        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({
                status: false, message: "Invalid request parameters. Please provide user's details to update."
            })
        }

        const findUserProfile = await userModel.findOne({ _id: userId })
        if (!findUserProfile) {
            return res.status(400).send({ status: false, message: `User doesn't exists by ${userId}` })
        }

        // Extract params
        let { fname, lname, email, phone, password, address, profileImage } = requestBody;

        //validations for update of user details.

        if (!validator.validString(fname)) {
            return res.status(400).send({ status: false, message: 'fname is needed' })
        }
        if (fname) {
            if (!validator.isValid(fname)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide fname" })
            }
        }
        if (!validator.validString(lname)) {
            return res.status(400).send({ status: false, message: 'lname is needed' })
        }
        if (lname) {
            if (!validator.isValid(lname)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide lname" })
            }
        }

        //email validation
        if (!validator.validString(email)) {
            return res.status(400).send({ status: false, message: 'email is needed' })
        }
        if (email) {
            if (!validator.isValid(email)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide email" })
            }
            if (!/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email)) {
                return res.status(400).send({ status: false, message: `Email should be a valid email address` });
            }
            let isEmailAlredyPresent = await userModel.findOne({ email: email })
            if (isEmailAlredyPresent) {
                return res.status(400).send({ status: false, message: `Unable to update email. ${email} is already registered.` });
            }
        }

        //phone validation
        if (!validator.validString(phone)) {
            return res.status(400).send({ status: false, message: 'phone number is needed' })
        }
        if (phone) {
            if (!validator.isValid(phone)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide Phone number." })
            }
            if (!/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(phone)) {
                return res.status(400).send({ status: false, message: `Please enter a valid Indian phone number.` });
            }
            let isPhoneAlredyPresent = await userModel.findOne({ phone: phone })
            if (isPhoneAlredyPresent) {
                return res.status(400).send({ status: false, message: `Unable to update phone. ${phone} is already registered.` });
            }
        }

        //password validation and setting range of password.
        if (!validator.validString(password)) {
            return res.status(400).send({ status: false, message: 'password is needed' })
        }
        let tempPassword = password
        if (tempPassword) {
            if (!validator.isValid(tempPassword)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide password" })
            }
            if (!(tempPassword.length >= 8 && tempPassword.length <= 15)) {
                return res.status(400).send({ status: false, message: "Password should be Valid min 8 and max 15 " })
            }
            var encryptedPassword = await bcrypt.hash(tempPassword, 10)
        }

        //Address validation ->
       
        let parseBody = JSON.parse(JSON.stringify(requestBody))
        console.log(parseBody)
        if (parseBody.address == 0) {
            return res.status(400).send({ status: false, message: 'Please add shipping or billing address to update' })
        }
        if (address) {
            let jsonAddress = JSON.parse(JSON.stringify(address))
            if (!(Object.keys(jsonAddress).includes('shipping') || Object.keys(jsonAddress).includes('billing'))) {
                return res.status(400).send({ status: false, message: 'Please add shipping or billing address to update' })
            }

            let { shipping, billing } = parseBody.address
            if (shipping == 0) {
                return res.status(400).send({ status: false, message: 'Please add street, city or pincode to update for shipping' })
            }
            if (shipping) {
                if (!(Object.keys(shipping).includes('street') || Object.keys(shipping).includes('city') || Object.keys(shipping).includes('pincode'))) {
                    return res.status(400).send({ status: false, message: 'Please add street, city or pincode for shipping to update' })
                }

                if (shipping.street == 0) {
                    return res.status(400).send({ status: false, message: `Please provide shipping address's Street` })
                }

                if (shipping.city == 0) {
                    return res.status(400).send({ status: false, message: `Please provide shipping address's city` })
                }

                if (shipping.pincode == 0) {
                    return res.status(400).send({ status: false, message: `Please provide shipping address's pincode` })
                }
                if (shipping.pincode) {
                    if (!(/^[1-9][0-9]{5}$/.test(shipping.pincode))) {
                        return res.status(400).send({ status: false, message: 'Pleasee provide a valid pincode to update' })
                    }
                }
                var shippingStreet = shipping.street
                var shippingCity = shipping.city
                var shippingPincode = shipping.pincode
            }

            if (billing == 0) {
                return res.status(400).send({ status: false, message: 'Please add street, city or pincode to update for billing' })
            }
            if (billing) {
                if (!(Object.keys(billing).includes('street') || Object.keys(billing).includes('city') || Object.keys(billing).includes('pincode'))) {
                    return res.status(400).send({ status: false, message: 'Please add street, city or pincode for billing to update' })
                }

                if (billing.street == 0) {
                    return res.status(400).send({ status: false, message: `Please provide billing address's Street` })
                }
                if (billing.city == 0) {
                    return res.status(400).send({ status: false, message: `Please provide billing address's city` })
                }
                if (billing.pincode == 0) {
                    return res.status(400).send({ status: false, message: `Please provide billing address's pincode` })
                }
                if (billing.pincode) {
                    if (!(/^[1-9][0-9]{5}$/.test(billing.pincode))) {
                        return res.status(400).send({ status: false, message: 'Pleasee provide a valid pincode to update' })
                    }
                }
                var billingStreet = billing.street
                var billingCity = billing.city
                var billingPincode = billing.pincode
            }
        }



        //validating user's profile image.

        if (files) {
            if (validator.isValidRequestBody(files)) {
                if (!(files && files.length > 0)) {
                    return res.status(400).send({ status: false, message: "Invalid request parameter, please provide profile image" })
                }
                var updatedProfileImage = await aws.uploadFile(files[0])
            }
        }

        //Validation ends

        //object destructuring for response body.
        let changeProfileDetails = await userModel.findOneAndUpdate({ _id: userId }, {
             
                fname: fname, lname: lname, email: email, profileImage: updatedProfileImage, phone: phone, password: encryptedPassword,
                'address.shipping.street': shippingStreet,
                'address.shipping.city': shippingCity,
                'address.shipping.pincode': shippingPincode,
                'address.billing.street': billingStreet,
                'address.billing.city': billingCity,
                'address.billing.pincode': billingPincode
            
        }, { new: true })

        return res.status(200).send({ status: true, data: changeProfileDetails })
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}

module.exports.updateUser = updateUser
module.exports.userLogin = userLogin
module.exports.getauseradetails = getauseradetails
module.exports.registerUser = registerUser