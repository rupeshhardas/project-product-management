const productModel = require("../models/productModel")
const userModel = require("../models/productModel")
const aws = require("../aws")
const validator = require("../utils/validator")


const createProduct = async function (req, res) {
    try {
        files = req.files
        data = req.body

        if (Object.keys(req.body) == 0) {
            return res.status(400).send({ status: false, msg: "data is missing" })
        }

        let { title, description, price, currencyId, currencyFormat, availableSizes } = data

        if (!validator.isValid(title)) {
            return res.status(400).send({ status: false, msg: "title is required" })
        }

        const findTitle = await productModel.findOne({ title: title })
        if (findTitle) {
            return res.status(400).send({ status: false, msg: "title is already exist" })
        }

        if (!validator.isValid(description)) {
            return res.status(400).send({ status: false, msg: "description is required" })
        }

        if (!validator.isValid(price)) {
            return res.status(400).send({ status: false, msg: "price is required" })
        }

        if (!validator.isValid(currencyId)) {
            return res.status(400).send({ status: false, msg: "curruncyId is required" })
        }
        if (currencyId != 'INR') {
            return res.status(400).send({ status: false, message: 'currencyId should be INR' })
        }

        if (!validator.isValid(currencyFormat)) {
            return res.status(400).send({ status: false, msg: "currencyFormat is required" })
        }


        if (!validator.isValid(availableSizes)) {
            return res.status(400).send({ status: false, msg: " please mention the sizes" })
        }

        if (files && files.length > 0) {
            data['productImage'] = await aws.uploadFile(files[0])
        } else {
            return res.status(400).send({ status: false, message: "please provide product picture " })
        }


        let availableSizesInArray = availableSizes.map(x => x.trim())
        for (let i = 0; i < availableSizesInArray.length; i++) {
            if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(availableSizesInArray[i]))) {
                return res.status(400).send({ status: false, message: "AvailableSizes contains ['S','XS','M','X','L','XXL','XL'] only" })
            }
        }

        const saveData = await productModel.create(data)
        res.status(201).send({ status: true, data: saveData })

    } catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const getProductsBYFilter = async function (req, res) {
    try {
        

        const requestQuery = req.query
          console.log(requestQuery.priceSort)
        const { size, name, priceGreaterThan, priceLessThan,priceSort } = requestQuery

        const finalData = [{ isDeleted: false }]

        if (validator.isValid(name)) {
            finalData.push({ title: { $regex: name, $options: 'i' } })
        }
        if (validator.isValid(size)) {
            if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size))) {
                return res.status(400).send({ status: false, message: "please enter valid size  " })
            }
            finalData.push({ availableSizes: size })
        }

        if (validator.isValidNumber(priceGreaterThan)) {

            finalData.push({ price: { $gt: priceGreaterThan } })
        }
        if (validator.isValidNumber(priceLessThan)) {

            finalData.push({ price: { $lt: priceLessThan } })
        }


        // if there is a price to sort 
        if (validator.isValidNumber(priceSort)) {

            if (priceSort != 1 && priceSort != -1) {
                return res.status(400).send({ status: false, message: "pricesort must to 1 or -1" })
            }
            const fillteredSort = await productModel.find({ $and: finalData }).sort({ price: priceSort })

            if (fillteredSort.length == 0) {
                return res.status(404).send({ status: false, message: "data not found" })
            }

            return res.status(200).send({ status: true, message: "products with sorted price", data: fillteredSort })
        }

        //   
        const fillteredProducts = await productModel.find({ $and: finalData })

        if (fillteredProducts.length === 0) {
            return res.status(404).send({ status: false, message: "data not found" })
        }

        return res.status(200).send({ status: true, message: "products without sorted price", data: fillteredProducts })


    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const getproductById = async function (req, res) {
    try {
        let data = req.params.productId;

        if (!validator.isValidObjectId(data)) { return res.status(400).send({ status: false, msg: 'Invalid Format of productId' }) }

        const productData = await productModel.findById(data);
        if (!productData) {
            return res.status(404).send({ status: false, msg: `product is not present in DB!` })
        }

        res.status(200).send({ status: true, msg: `product details`, data: productData })


    }
    catch (error) {
        res.status(500).send({ status: false, error: error.message });
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


const updateProduct = async function (req, res) {
    try {

        const productId = req.params.productId

        if (!validator.isValidRequestBody(req.body)) {
            return res.status(400).send({ status: false, message: "Bad Request there is no data in input field", });
        }
        const { description, title, isFreeShipping, price, style, availableSizes, installments } = req.body


        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Invalid productId" });
        }

        let productPresent = await productModel.findOne({ _id: productId, isDeleted: false, });
        if (!productPresent) {
            return res.status(404).send({ status: false, message: `product with this id : ${productId} not found` });
        }

        if (title) {

            if (!validator.isValid(title)) {
                return res.status(400).send({ status: false, message: "Bad request please provoide valid title" })
            }

            const findTitle = await productId.findOne({ title: title })
            if (findTitle) { return res.status(400).send({ status: false, msg: "title is already exist" }) }


        }
        if (isFreeShipping) {
            if (!validator.isValid(isFreeShipping) || isFreeShipping != "true" || isFreeShipping != "false") {
                return res.status(400).send({ status: false, message: "Bad request please provoide valid isFreeShipping it only accept true or false value" })
            }

        }
        if (price) {

            if (!validator.isValid(price)) {
                return res.status(400).send({ status: false, message: "Bad request please provoide valid price" })
            }
        }
        if (description) {

            if (!validator.isValid(description)) {
                return res.status(400).send({ status: false, message: "Bad request please provoide valid description" })
            }
        }
        if (style) {
            if (!validator.isValid(style)) {
                return res.status(400).send({ status: false, message: "Bad request please provoide valid style" })
            }
        }
        console.log(availableSizes)
        if (availableSizes) {
            if (!validator.isValid(availableSizes)) {
                return res.status(400).send({ status: false, message: "please enter availableSizes " })
            }
            let availableSizesInArray = availableSizes.map(x => x.trim())
            for (let i = 0; i < availableSizesInArray.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(availableSizesInArray[i]))) {
                    return res.status(400).send({ status: false, message: "AvailableSizes contains ['S','XS','M','X','L','XXL','XL'] only" })
                }
            }
        }

        //installment validation

        if (installments) {
            if (!validator.isValid(installments)) {
                return res.status(400).send({ status: false, message: "Bad request please provoide valid installments number" })
            }

        }
        //************ */
        //  const updateProduct = await
        if (req.files) {
            let uploadedFileURL;
            let files = req.files // file is the array

            if (files && files.length > 0) {

                uploadedFileURL = await aws.uploadFile(files[0])

                if (uploadedFileURL) {
                    req.body.productImage = uploadedFileURL
                } else {
                    return res.status(400).send({ status: false, message: "error uploadedFileURL is not present" })
                }

            }

        }

        const updatedProduct = await productModel.findByIdAndUpdate(productId, req.body, { new: true })

        if (!updatedProduct) {
            return res.status(404).send({ status: false, message: "product not found and not updated" })
        } else {
            return res.status(200).send({ status: true, data: updatedProduct })
        }
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


const deleteProduct = async function (req, res) {
    try {
        const param = req.params
        const productId = param.productId

        //validation starts
        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: `${productId} not exists` })
        }
        //vaidation ends.

        // finding product for deletion 
        const product = await productModel.findOne({ _id: productId })

        if (!product) {
            return res.status(400).send({ status: false, message: `Product not present by ${productId}` })
        }
        if (product.isDeleted == false) {
            await productModel.findOneAndUpdate({ _id: productId }, { $set: { isDeleted: true, deletedAt: new Date() } }) //setting time

            return res.status(200).send({ status: true, message: `product deleted sucessfully.` })
        }
        return res.status(400).send({ status: true, message: `product deleted earlier` })


    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}


module.exports.updateProduct = updateProduct
module.exports.getproductById = getproductById
module.exports.createProduct = createProduct
module.exports.getProductsBYFilter = getProductsBYFilter
module.exports.deleteProduct = deleteProduct