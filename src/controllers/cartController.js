const { findOne, findOneAndDelete } = require("../models/cartModel")
const cartModel = require("../models/cartModel")
const productModel = require("../models/productModel")
const userModel = require("../models/userModel")
const validator = require("../utils/validator")

const createCart = async function (req, res) {
    try {
        userId = req.params.userId
        data = req.body

        if (!validator.isValidRequestBody(data)) {
            return res.status(400).send({
                status: false, message: "Invalid request parameters. Please provide user's details to update."
            })
        }


        let { cartId, productId, quantity } = data

        if (!validator.isValid(productId)) { return res.status(400).send({ status: false, message: 'Product Id is required' }) }

        if (!validator.isValid(quantity)) { return res.status(400).send({ status: false, message: 'quantity is required' }) }

        if (!validator.isValidObjectId(productId)) { return res.status(400).send({ status: false, message: 'Invalid product id' }) }

        if (!validator.isValidObjectId(userId)) { return res.status(400).send({ status: false, message: 'Invalid param user id' }) }

        const findinguser = await userModel.findById(userId)
        if (!findinguser) { return res.status(404).send({ status: false, msg: "user not found" }) }

        const findingProduct = await productModel.findById(productId)
        if (!findingProduct) { return res.status(404).send({ status: false, message: 'Product not Exist' }) }



        const findingcartAlreadyExist = await cartModel.findById(cartId)
        if (findingcartAlreadyExist) {


            if (userId == findingcartAlreadyExist.userId) {
                const findingCart = await cartModel.findById(cartId)

                for (let i = 0; i < findingCart.items.length; i++) {

                    if (productId == findingCart.items[i].productId) {
    
                        const totalPrice = findingCart.totalPrice + (findingProduct.price * data.quantity)
    
                        findingCart.items[i].quantity = findingCart.items[i].quantity + data.quantity
    
                        const newCart = await cartModel.findOneAndUpdate({ userId: userId }, { items: findingCart.items, totalPrice: totalPrice }, { new: true })
    
                        return res.status(201).send({ status: true, message: 'product added in cart', data: newCart })
    
                    }
                }

                totalPrice = findingProduct.price * quantity + findingCart.totalPrice

                totalItems = findingCart.totalItems + 1

                const AddToCart = {
                    $push: { items: [{ productId: productId, quantity: quantity }] },
                    totalPrice: totalPrice,
                    totalItems: totalItems
                }
                const updateCart = await cartModel.findOneAndUpdate({ _id: cartId }, AddToCart, { new: true })
                res.status(200).send({ status: true, msg: "product added to cart", data: updateCart })
            } else {
                return res.status(400).send({ status: false, message: 'params user id and body user id not match' })

            }
        } else {
            if (!validator.isValidObjectId(userId)) { return res.status(400).send({ status: false, message: 'Invalid params user id' }) }
            if (!validator.isValidObjectId(data.userId)) { return res.status(400).send({ status: false, message: 'Invalid body user id' }) }


            if (userId == data.userId) {
                const checkingCartexist = await cartModel.findOne({ userId: userId })
                if (checkingCartexist) { return res.status(400).send({ status: false, msg: "this user have already cart" }) }
                const createNewCart = {
                    userId: userId,
                    items: [{
                        productId: productId, quantity: quantity
                    }],
                    totalPrice: findingProduct.price * quantity,
                    totalItems: 1
                }

                const cartAdd = await cartModel.create(createNewCart)
                res.status(201).send({ status: true, msg: "cart created succesfully", data: cartAdd })
            } else {
                return res.status(400).send({ status: false, message: 'params user id and body user id not match' })
            }

        }
    } catch (err) {
        return res.status(500).send({ status: false, data: err.message });
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const removeProduct = async function (req, res) {


    try {

        const userId = req.params.userId
        const requestBody = req.body

        const { productId, cartId, removeProduct } = requestBody

        // validating the userId ,productId ,removeProduct,cartId

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "userId is invalid" })
        }

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "productId is invalid" })
        }
        if (!validator.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: "cartId is invalid" })
        }
        if (!validator.isValidNumber(removeProduct)) {
            if (removeProduct !== 0 && removeProduct !== 1) {
                return res.status(400).send({ status: false, message: "removeProduct  is must present and it should be Number i.e 0 or 1" })
            }
        }

        
        // checking the userId , productId and cartId  exists or not  in database
        const isUserExists = await userModel.findById(userId)
        if (!isUserExists) {
            return res.status(404).send({ status: false, message: "user data not found" })
        }
        const isProductExists = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!isProductExists) {
            return res.status(404).send({ status: false, message: "product data not found" })
        }
        const isCartExists = await cartModel.findById(cartId)
        if (!isCartExists) {
            return res.status(404).send({ status: false, message: "cart data not found" })
        }

        if (isCartExists.userId != userId) {
            return res.status({ status: false, message: "this cart is not belongs to this userid " })
        }
        // ---------------------------------------------------------------------------------------------
        let arrayOfItems = isCartExists.items
        console.log(arrayOfItems)
        if (arrayOfItems.length == 0) {
            return res.status(400).send({ status: false, message: "items is empty noting to update" })
        }
        for (i = 0; i <= arrayOfItems.length; i++) {
            if (arrayOfItems[i].productId == productId) {
                console.log(arrayOfItems[i].productId == productId)

                if (removeProduct == 0 || isCartExists.items[i].quantity == 1) {
                    const finalFilterToDelete = {
                        $pull: { items: { productId: productId } },
                        totalPrice: isCartExists.totalPrice - isProductExists.price * isCartExists.items[i].quantity,
                        totalItems: isCartExists.totalItems - 1
                    }

                    const productToDeleteFromCart = await cartModel.findOneAndUpdate({ items: { $elemMatch: { productId: arrayOfItems[i].productId } } }, finalFilterToDelete, { new: true })
                    return res.status(200).send({ status: true, message: "product successfully removed", data: productToDeleteFromCart })
                }

                const finalFilterToremoveQuantity = {
                    totalPrice: isCartExists.totalPrice - isProductExists.price,
                }

                finalFilterToremoveQuantity[`items.${i}.quantity`] = isCartExists.items[i].quantity - 1


                const productToRemoveFromCart = await cartModel.findOneAndUpdate({ _id: cartId }, finalFilterToremoveQuantity, { new: true })

                return res.status(200).send({ status: true, message: "cart updated successfully", data: productToRemoveFromCart })

            }
            return res.status(400).send({ status: false, message: "No products found with productId in cart" })


        }
        

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


const getCartWithProductDetails = async function (req, res) {
    try {
        userId = req.params.userId
        if (!validator.isValidObjectId(userId)) { return res.status(400).send({ status: false, message: 'Invalid product id' }) }

        const findinguser = await userModel.findById(userId)
        if (!findinguser) { return res.status(404).send({ status: false, msg: "user not found" }) }

        const findingcart = await cartModel.findOne({ userId: userId }).populate('items.productId')
        if (!findingcart) { return res.status(400).send({ status: false, msg: "cart not found" }) }

        res.status(201).send({ status: true, msg: "succesfully fetch product details", data: findingcart })
    } catch (err) {
        return res.status(500).send({ status: false, data: err.message });
    }

}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const deleteCart = async function (req, res) {
    try {
        const userId = req.params.userId;


        //validating userId
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId in params." })
        }
        const findUser = await userModel.findOne({ _id: userId })
        if (!findUser) {
            return res.status(400).send({ status: false, message: `User doesn't exists by ${userId} ` })
        }


        //finding cart
        const findCart = await cartModel.findOne({ userId: userId })
        if (!findCart) {
            return res.status(400).send({ status: false, message: `Cart doesn't exists by ${userId} ` })
        }
        //Basically not deleting the cart, just changing their value to 0.
        const deleteCart = await cartModel.findOneAndUpdate({ userId: userId }, {
            $set: { items: [], totalPrice: 0, totalItems: 0 }
        }, { new: true })
        return res.status(200).send({ status: true, message: "Cart deleted successfully", data: deleteCart })

    } catch (err) {
        return res.status(500).send({ status: false, data: err.message });
    }
}

module.exports.createCart = createCart
module.exports.removeProduct = removeProduct
module.exports.getCartWithProductDetails = getCartWithProductDetails
module.exports.deleteCart = deleteCart