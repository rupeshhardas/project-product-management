const orderModel = require('../models/orderModel')
const productModel = require('../models/productModel')
const userModel = require('../models/userModel')
const validator = require('../utils/validator')


const createOrder = async function (req, res) {
    try {
        const userId1 = req.params.userId
        const requestBody = req.body

        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({
                status: false, message: "Invalid request parameters. Please provide user's details to update."
            })
        }

        const { items, userId } = requestBody


        if (!validator.isValid(userId)) {
            return res.status(400).send({ status: false, message: "userId is required " })
        }

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid format of body userId" })
        }

        if (!validator.isValidObjectId(userId1)) {
            return res.status(400).send({ status: false, message: "Invalid format of params userId" })
        }

        if (req.body.userId != userId1) {
            return res.status(403).send({ status: false, message: "body userid and params user id not match" })
        }



        const UserExists = await userModel.findById(userId)
        if (!UserExists) {
            return res.status(404).send({ status: false, message: "user data not found" })
        }

        if (!Array.isArray(items) || items.length == 0) {
            return res.status(400).send({ status: false, message: "items should present and it should be in array  ,not a empty array" })
        }

        let totalQuantity = 0
        let totalPrice = 0
        let totalItems = 0

        for (i = 0; i < items.length; i++) {
            if (!validator.isValidObjectId(items[i].productId)) {
                return res.status(400).send({ status: false, message: `productId at  index ${i} is not valid objectId ` })
            }
            if (!validator.isValidNumber(items[i].quantity)) {
                return res.status(400).send({ status: false, message: `quantity at index ${i} is not a valid number` })
            }
            let findProduct = await productModel.findById(items[i].productId)
            totalQuantity = totalQuantity + items[i].quantity
            totalItems = i + 1
            totalPrice = totalPrice + findProduct.price * items[i].quantity

        }
        requestBody['totalQuantity'] = totalQuantity
        requestBody['totalItems'] = totalItems
        requestBody['totalPrice'] = totalPrice

        const ordercreation = await orderModel.create(requestBody)
        return res.status(201).send({ status: true, message: "successfully order created", data: ordercreation })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const updateOrder = async function (req, res) {
    try {

        const userId = req.params.userId
        const requestBody = req.body

        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({
                status: false, message: "Invalid request parameters. Please provide user's details to update."
            })
        }


        const { orderId, status } = requestBody

        if (!validator.isValid(status)) {
            return res.status(400).send({ status: false, message: "status is required for updation" })
        }
        if (!validator.isValidstatus(status)) {
            return res.status(400).send({ status: false, message: "status should be enum value =>completed,cancled or pending" })
        }

        if (!validator.isValid(orderId)) {
            return res.status(400).send({ status: false, message: "orderId required for updation" })
        }

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "userId is in valid" })
        }
        if (!validator.isValidObjectId(orderId)) {
            return res.status(400).send({ status: false, message: "orderId is in valid" })
        }

        const UserExists = await userModel.findById(userId)
        if (!UserExists) {
            return res.status(404).send({ status: false, message: "userData not found" })
        }

        const OrderExists = await orderModel.findById(orderId)
        if (!OrderExists) {
            return res.status(404).send({ status: false, message: "orderData not found" })
        }

        if (OrderExists.userId != userId) {
            console.log(isOrderExists.userId !== userId)
            return res.status(400).send({ status: false, message: "order user id and params user id not match" })
        }
        if (status == "cancled") {
            const updatedData = await orderModel.findOneAndUpdate({ _id: orderId, cancellable: true }, { status: requestBody.status, isDeleted: true }, { new: true })
            if (!updatedData) {
                return res.status(404).send({ status: false, message: "data not found for update" })
            }

            return res.status(200).send({ status: true, message: `order ${req.body.status} successfully`, data: updatedData })
        } else {
            const updatedData = await orderModel.findOneAndUpdate({ _id: orderId, cancellable: true }, { status: requestBody.status,isDeleted: false }, { new: true })
            if (!updatedData) {
                return res.status(404).send({ status: false, message: "data not found for update" })
            }

            return res.status(200).send({ status: true, message: `order ${req.body.status} successfully`, data: updatedData })

        }

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = { createOrder, updateOrder }