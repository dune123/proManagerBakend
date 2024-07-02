const express=require('express')
const requireAuth=require("../middlewares/requireAuth")
const { createTask, changeStatus, getTask, getanalytics, changeChecklistDone, getTaskwithoutId, deleteTask, editTask, changeChecklistStatus }=require('../contorllers/taskController')


const router=express.Router()
router.post("/createTask",requireAuth,createTask)
router.post("/changeStatus",requireAuth,changeStatus)
router.get("/getTask/:filter",requireAuth,getTask)
router.get("/getanalytics",requireAuth,getanalytics)
router.post("/changeCheckliststatus",requireAuth,changeChecklistStatus)
router.get("/getTaskWithoutId/:taskId",getTaskwithoutId)
router.post("/deleteTask",requireAuth,deleteTask)
router.put("/editTask/:taskId",requireAuth,editTask)
router.post('/changeChecked/:taskId',requireAuth,changeChecklistDone)

module.exports=router