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

            res.setHeader("Authorization", token);
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

        const requestBody = req.body
        const userId = req.params.userId

        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, mesaage: "invalid body" })
        }
        const { fname, lname, email, phone, password, address } = requestBody                           //distructing the requestBody

        let finalFilter = {}

        //checking that input and  if valid assigning (key value)to the finalFilter to update
        if (validator.isValid(fname)) {
            finalFilter["fname"] = fname
        }
        if (validator.isValid(lname)) {
            finalFilter["lname"] = lname
        }

        if (validator.isValid(email)) {
            if (!/^([a-z0-9\.-]+)@([a-z0-9-]+).([a-z]+)$/.test(email.trim())) {
                return res.status(400).send({ status: false, message: "EMAIL is not valid" })
            }
            const isEmailAlreadyUsed = await userModel.findOne({ email })                           //checking the email already used
            if (isEmailAlreadyUsed) {
                return res.status(400).send({ status: false, message: "email already used " })
            }
            finalFilter["email"] = email

        }

        if (validator.isValid(phone)) {
            if (!(!isNaN(phone)) && /^(?:(?:\+|0{0,2})91(\s*[\ -]\s*)?|[0]?)?[789]\d{9}|(\d[ -]?){10}\d$/.test(phone.trim())) {
                return res.status(400).send({ status: false, message: " PHONE NUMBER is not a valid mobile number" });
            }
            const isphoneNumberAlreadyUsed = await userModel.findOne({ phone })                           //checking the number already used
            if (isphoneNumberAlreadyUsed) {
                return res.status(400).send({ status: false, message: "phone Number already used " })
            }
            finalFilter["phone"] = phone
        }
        // checking for password length 

        if (validator.isValid(password)) {
            if (password.length < 8 || password.length > 15) {
                return res.status(400).send({ status: false, mesaage: "password length should be inbetween 8 and 15 " })
            }
            const salt = bcrypt.genSaltSync(10);
            const hashPassword = await bcrypt.hash(password, salt);
            finalFilter["password"] = hashPassword
        }

        if (validator.isValid(address)) {

            if (validator.isValid(address.shipping)) {

                if (address.shipping.street) {
                    if (!validator.isValid(address.shipping.street)) {
                        return res.status(400).send({ status: false, mesaage: "street must be valid" })
                    }
                    finalFilter["address.shipping.street"] = address.shipping.street
                }
                if (address.shipping.pincode) {
                    if (!validator.isValidNumber(address.shipping.pincode)) {
                        return res.status(400).send({ status: false, mesaage: "shipping pincode must be number" })
                    }
                    finalFilter["address.shipping.pincode"] = address.shipping.pincode
                }

                if (address.shipping.city) {
                    if (!validator.isValid(address.shipping.city)) {
                        return res.status(400).send({ status: false, mesaage: "city must be string" })
                    }
                    finalFilter["address.shipping.city"] = address.shipping.city
                }
            }

            if (validator.isValid(address.billing)) {
                if (address.billing.street) {
                    if (!validator.isValid(address.billing.street)) {
                        return res.status(400).send({ status: false, mesaage: " billing street must be valid" })
                    }
                    finalFilter["address.billing.street"] = address.billing.street
                }
                if (address.billing.pincode) {
                    if (!validator.isValidNumber(address.billing.pincode)) {
                        return res.status(400).send({ status: false, mesaage: "billing pincode must be number" })
                    }
                    finalFilter["address.billing.pincode"] = address.billing.pincode
                }
                if (address.billing.city) {
                    if (!validator.isValid(address.billing.city)) {
                        return res.status(400).send({ status: false, mesaage: "city must be string" })
                    }
                    finalFilter["address.billing.city"] = address.billing.city
                }
            }
        }

        // creating the aws link to update           
        let files = req.files
        if (files) {
            if (files && files.length > 0) {

                const profileImage = await aws.uploadFile(files[0])

                if (profileImage) {
                    finalFilter["profileImage"] = profileImage
                }
            }
        }
        const postData = await userModel.findOneAndUpdate({ _id: userId }, { $set: finalFilter }, { new: true })

        return res.status(200).send({ status: true, message: "User profile updated", data: postData })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports.updateUser = updateUser
module.exports.userLogin = userLogin
module.exports.getauseradetails = getauseradetails
module.exports.registerUser = registerUser