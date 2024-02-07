const express=require("express");
const router=express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError=require("../utils/ExpressError.js");
const {listingSchema,reviewSchema}=require("../schema.js");
const Listing = require("../models/listing.js");
const {isLoggedIn,isOwner} = require("../middleware.js");
const ListingController =require("../controllers/listing.js");
const multer  = require('multer');
const {storage}=require("../cloudConfig.js");
const upload = multer({ storage});

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

//Index Route
router.get("/", wrapAsync(ListingController.index));

//New Route
router.get("/new",isLoggedIn,ListingController.renderNewForm);

//Search
router.get("/search", wrapAsync(ListingController.filterListing));

router.get("/country", wrapAsync(ListingController.countryListing));
//Show Route
router.get("/:id", wrapAsync(ListingController.showListing));

//Create Route
router.post("/",isLoggedIn, upload.single("listing[image]"), validateListing,wrapAsync(ListingController.createListing));

//Edit Route
router.get("/:id/edit", isLoggedIn,isOwner,wrapAsync(ListingController.renderEditForm));

//Update Route
router.put("/:id",isLoggedIn,isOwner, upload.single("listing[image]"),validateListing,wrapAsync(ListingController.updateListing));

//Delete Route
router.delete("/:id", isLoggedIn,isOwner,wrapAsync(ListingController.destroyListing));

module.exports=router;
