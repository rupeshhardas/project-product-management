const express=require('express');
const router=express.Router();
const userController = require("../controllers/userControllers")
const productController = require("../controllers/productController")
const middleware = require("../middlewares/auth")
const cartController = require("../controllers/cartController")
const orderController = require("../controllers/orderController")

// USER API

router.post("/register",userController.registerUser)

router.post("/login", userController.userLogin)

router.get("/user/:userId/profile",middleware.userAuth, userController.getauseradetails)

router.put("/user/:userId/profile",middleware.userAuth, userController.updateUser)

// PRODUCT API

router.post("/products", productController.createProduct)

router.get("/products",productController.getProductsBYFilter)

router.get("/products/:productId",productController.getproductById)

router.put("/products/:productId",productController.updateProduct)

router.delete("/products/:productId",productController.deleteProduct)

// CART API

router.post("/users/:userId/cart",middleware.userAuth, cartController.createCart)

router.put("/users/:userId/cart",middleware.userAuth, cartController.removeProduct)

router.get("/users/:userId/cart",middleware.userAuth, cartController.getCartWithProductDetails)

router.delete("/users/:userId/cart",middleware.userAuth, cartController.deleteCart)

// ORDER API

router.post("/users/:userId/orders", middleware.userAuth,orderController.createOrder)

router.put("/users/:userId/orders",middleware.userAuth, orderController.updateOrder)

module.exports=router