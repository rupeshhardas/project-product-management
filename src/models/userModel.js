const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

const userSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: true,
        trim: true
    },
    lname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    profileImage: {
        type: String,
        required: true,
        trim: true
    }, // s3 link
    phone: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 15
    }, // encrypted password
    address: {
        shipping: {
            street: {
                type: String,
                required: true
            },
            city: {
                type: String,
                required: true
            },
            pincode: {
                type: Number,
                required: true
            }
        },
        billing: {
            street: {
                type: String,
                required: true
            },
            city: {
                type: String,
                required: true
            },
            pincode: {
                type: String,
                required: true
            }
        }
    }

}, { timestamps: true })

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        console.log(this.password)
        this.password = await bcrypt.hash(this.password, 10)
        console.log(this.password)
    }
    next()
})


module.exports = mongoose.model("user", userSchema)