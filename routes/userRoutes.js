const express=require('express')
const {registerUser, loginUser, changePassword, getEmailById, logoutUser, addBoardUser, getBoardUsers, checkUser}=require("../contorllers/userController")
const requireAuth = require('../middlewares/requireAuth')

const router=express.Router()
router.post("/register",registerUser)
router.get('/checUser',requireAuth,checkUser)
router.post("/login",loginUser)
router.post("/logout",requireAuth,logoutUser)
router.post("/changePassword",requireAuth,changePassword)
router.get("/getEmailByUserId",requireAuth,getEmailById)
router.post("/addBoardUser",requireAuth,addBoardUser)
router.get('/getBoardUser',requireAuth,getBoardUsers)

module.exports=router;