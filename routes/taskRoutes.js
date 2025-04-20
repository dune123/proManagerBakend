const express=require('express')
const requireAuth=require("../middlewares/requireAuth")
const { createTask, changeStatus, getTask, getTaskwithoutId, deleteTask, editTask, changeChecklistItems, getTaskById, getAnalytics, checkListSuggestion, reorderTask }=require('../contorllers/taskController')

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
router.post('/reorder',requireAuth,reorderTask)

module.exports=router