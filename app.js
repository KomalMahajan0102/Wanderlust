if(process.env.NODE_ENV!="production"){
require('dotenv').config();
}
// console.log(process.env.SECRET)
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const path = require("path");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError=require("./utils/ExpressError.js");
const {listingSchema,reviewSchema}=require("./schema.js");
const { wrap } = require("module");
const session=require("express-session");
const MongoStore =require("connect-mongo");
const flash=require("connect-flash");

const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");

const listingsRouter=require("./routes/listing.js");
const reviewsRouter=require("./routes/review.js");
const usersRouter=require("./routes/user.js");

const Listing = require("./models/listing.js");
app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.engine("ejs", ejsMate);

app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")));
const dbUrl=process.env.ATLASDB_URL;
main().then(() => {
    console.log("connected");
})
    .catch((err) => {
        console.log(err);

    })


async function main() {
    await mongoose.connect(dbUrl);
}
app.listen(8080, () => {
    console.log("Server is listening to port 8080");
});
app.get("/", async(req, res) => {
   const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
});
const store=MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter:24*3600,
});
store.on("error",()=>{
    console.log("ERROR in MONGO SESSION STORE",err);
});
const sessionOption={
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires: Date.now() + 7*24*60*60*1000,
        maxaAge: 7*24*60*60*1000,
        httpOnly:true

    },
}



app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    next();
})

app.get("/demouser", async(req,res)=>{
    let newUser= new User({
        email:"komal@gmail.com",
        username:"komal",
    });
    let usernew= await User.register(newUser,"helloworld");
    res.send(usernew);
})
const validateListing=(req,res,next)=>{
    let {error}=listingSchema.validate(req.body);
    if(error){
        let errMsg=error.details.map((el)=>el.message).join(",");
        throw new ExpressError(400,error);
    }
    else{
        next();
    }
}
const validateReview=(req,res,next)=>{
    let {error}=reviewSchema.validate(req.body);
    if(error){
        let errMsg=error.details.map((el)=>el.message).join(",");
        throw new ExpressError(400,error);
    }
    else{
        next();
    }
}

app.use("/listings",listingsRouter);
app.use("/listings/:id/reviews",reviewsRouter);
app.use("/",usersRouter);

app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page Not found!"));

})


app.use((err, req, res, next) => {
    let {statusCode=500 , message="Something went wrong" }=err;
    // res.status(statusCode).send(message);
    res.status(statusCode).render("error.ejs",{message});
})




// app.get("/testListing",async (req,res)=>{
//     let sampleListing=new Listing({
//         title:"My New Villa",
//         description: "By the beach",
//         price: 1200,
//         location: "Calangute,Goa",
//         country:"India"
//     });
//     await sampleListing.save();
//     console.log("Sample was saved");
//     res.send("successful testing");
// })
