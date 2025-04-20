const express=require('express')
const requireAuth=require("../middlewares/requireAuth")
const { createTask, changeStatus, getTask, getTaskwithoutId, deleteTask, editTask, changeChecklistItems, getTaskById, getAnalytics, checkListSuggestion }=require('../contorllers/taskController')

const router=express.Router()
router.post("/createTask",requireAuth,createTask)
router.post("/changeStatus",requireAuth,changeStatus)
router.get("/getTask",requireAuth,getTask)
router.get("/getTaskWithoutId/:taskId",getTaskwithoutId)
router.delete("/deleteTask",requireAuth,deleteTask)
router.put("/editTask/:taskId",requireAuth,editTask)
router.put("/checklistChange",requireAuth,changeChecklistItems)
router.get('/getTaskById/:taskId',getTaskById)
router.get('/getanalytics',requireAuth,getAnalytics)
router.get('/checklistsuggestion/:taskName',checkListSuggestion)

module.exports=router