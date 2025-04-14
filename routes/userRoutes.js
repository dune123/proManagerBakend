const express=require('express')
const {registerUser, loginUser, changePassword, getEmailById, logoutUser}=require("../contorllers/userController")
const requireAuth = require('../middlewares/requireAuth')

const router=express.Router()
router.post("/register",registerUser)
router.post("/login",loginUser)
router.post("/logout",requireAuth,logoutUser)
router.post("/changePassword",requireAuth,changePassword)
router.get("/getEmailByUserId",requireAuth,getEmailById)

module.exports=router;