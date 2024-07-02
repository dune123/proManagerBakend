const express=require('express')
const {registerUser, loginUser, addboardUser, getBoardUsers, changePassword, getEmailById, logoutUser}=require("../contorllers/userController")
const requireAuth = require('../middlewares/requireAuth')

const router=express.Router()
router.post("/register",registerUser)
router.post("/login",loginUser)
router.post("/logout",requireAuth,logoutUser)
router.post("/addBoardUser",requireAuth,addboardUser)
router.get("/getBoardUser",requireAuth,getBoardUsers)
router.post("/changePassword",requireAuth,changePassword)
router.get("/getEmailByUserId",requireAuth,getEmailById)

module.exports=router;