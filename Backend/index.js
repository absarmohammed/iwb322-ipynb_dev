const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer =require("multer");
const path = require("path");
const cors = require("cors");
const { type } = require("os");
const { error } = require("console");

app.use(express.json());
app.use(cors());

//Database Connecction with MongoDB
mongoose.connect("mongodb+srv://Username:Password@cluster0.dezgn.mongodb.net/shopper");

//API Creation
app.get("/",(req,res)=>{
    res.send("Express App is Running");

})

//Storage engine

const storage = multer.diskStorage({
    destination : './upload/images',
    filename : (req,file,cb)=>{
        return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({storage:storage})

//uploading endpoint
app.use('/images',express.static('upload/images'))
app.post("/upload",upload.single('product'),(req,res)=>{
    res.json({
        success:1,
        image_url:`http://localhost:${port}/images/${req.file.filename}` 
    })
})
 
//create product
const Product = mongoose.model("Product",{
    id:{
        type: Number,
        required: true,
    },

    name:{
        type:String,
        required: true,

    },
    image:{
        type:String,
        required: false,
    },
    category:{
        type:String,
        required: true,
    },
    new_price:{
        type:Number,
        required: true,
    },
    old_price:{
        type:Number,
        required: true,
    },
    date:{
        type: Date,
        default: Date.now,
    },
    available:{
        type: Boolean,
        default: true,
    }

})

app.post('/addproduct',async (req,res)=>{
    let products = await Product.find({});
    let id;
    if(products.length > 0){
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id + 1;
    }
    else{
        id = 1;
    }
    const product = new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price,
    });
    console.log(product);
    await product.save();
    console.log("Saved"); 
    res.json({
        success:true,
        name:req.body.name,
    })
})

//API for Deleting

app.post('/removeproduct',async (req,res)=>{
    await Product.findOneAndDelete({id:req.body.id},);
    console.log("Deleted");
    res.json({
        success:true,
        name:req.body.name,
    })
})

//API for getting all products

app.get('/allproduct',async (req,res)=>{
    let products = await Product.find({});
    console.log("All product fetched");
    res.send(products);
})


//schema creating for user model

const User = mongoose.model('User',{
    name:{
        type: String,
    },
    email:{
        type: String,
        unique: true,
    },
    password:{
        type: String,
    },
    cartData:{
        type:Object,
    },
    date:{
        type: Date,
        default: Date.now,
    }
})

//creating endpoint for register user
app.post('/signup',async(req,res)=>{
    let check = await User.findOne({email:req.body.email});
    if(check){
        return res.status(400).json({success:false,errors:"Existing user found"})
    }
    let cart = {};
    for (let i = 0; i < 300; i++) {
        cart[i] = 0;
    }
    const user = new User({
        name:req.body.name,
        email:req.body.email,
        password:req.body.password,
        cartData:cart,
    })

    await user.save();

    const data = {
        user:{
            id:user.id,
        }
    }
    const token = jwt.sign(data,'secret_ecom');
    res.json({
        success:true,
        token:token,
        user:user.name,
    })
})

//creating endpoint for login user
app.post('/login',async (req, res) =>{
    let user = await User.findOne({email:req.body.email});
    if(user){
        const passCompare = req.body.password === user.password;
        if(passCompare){
            const data = {
                user:{
                    id:user.id,
                }
            }
            const token = jwt.sign(data,'secret_ecom');
            res.json({
                success:true,
                token:token,
                user:user.name,
            })
        }
        else{
            res.json({success:false,errors:"wrong password"})
        }
    }
    else{
        res.json({success:false,errors:"Wrong Email"})
    }
})

//creating endpoint for newcollection data
app.get('/newcollection',async (req,res)=>{
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    console.log("New Collection fetched");
    res.send(newcollection);
})

//creating entpoint for popular in woman section
app.get('/popularinwomen',async (req,res)=>{
    let products = await Product.find({category:'woman'});
    let popular_in_woman = products.slice(0,4);
    console.log("Popular in women fetched");
    res.send(popular_in_woman);
})

//creating endpoint for adding product in cart
app.post('/addtocart',async(req,res)=>{
    console.log(req.body);
})


app.listen(port,(error)=>{
    if(!error){
        console.log("Server is running on Port" + port);
    }
    else{
        console.log("Error: " + error);
    }
});
