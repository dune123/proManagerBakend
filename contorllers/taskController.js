
const dotenv = require("dotenv");
const axios =require('axios');
const mongoose = require("mongoose");
const { GoogleGenerativeAI } = require("@google/generative-ai");
dotenv.config();

const Task = require("../models/task");
const User = require("../models/user");

// Error handler middleware
const errorHandler = (res, error) => {
  console.error(error);
  res.status(500).json({ error: "Internal Server Error" });
};

//to create a new Task
const createTask = async (req, res, next) => {
  try {
    let { taskName, priority,checkList,dueDate,status,assignedEmail } = req.body;

    const userId = req.user;
    if(!taskName){
      return res.status(404).json({message:"please provide title"})
    }
    if(!checkList){
      return res.status(404).json({message:"please provide checklist"})
    }
    else{
      if (!Array.isArray(checkList)) {
        return res.status(404).json({ message: "Checklist should be an array" });
      }
      
      for (const item of checkList) {
        if (item.description.trim() === "") {
          return res.status(404).json({ message: "Checklist item cannot be empty" });
        }
      }
    }
    if(!priority){
      return res.status(404).json({message:"please provide priority"})
    }

    if(!status){
      return res.status(404).json({message:"please provide status"})
    }

    if(!dueDate){
      return res.status(404).json({message:"due date is required"})
    }
    else{
      if(dueDate<Date.now()){
        return res.status(404).json({message:"due date can not be less than today"})
      }
    }

    const findLoginedUser = await User.findById(userId);

    const newTask = new Task({
      taskName,
      checklist:checkList,
      priority,
      status,
      assigned:assignedEmail==="None"?findLoginedUser.email:assignedEmail,
      duedate:dueDate
    });

    const savedTask = await newTask.save();

    if(assignedEmail!=="None"){
      const assignedUser=await User.findOne({email:assignedEmail});

      assignedUser.tasks.push(savedTask._id);

      await assignedUser.save()
    }


    //saving under the person who is creating the task

    findLoginedUser.tasks.push(savedTask._id);

    await findLoginedUser.save();

    return res
      .status(201)
      .json({
        message: "Task created and assigned successfully",
      });
  } catch (error) {
    errorHandler(res, error);
  }
};

//To change the task
const changeStatus = async (req, res, next) => {
  try {
    const { taskId, newStatus } = req.body;

    const findTask = await Task.findById(taskId);

    if (!findTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    findTask.status = newStatus;

    await findTask.save();

    return res
      .status(201)
      .json({ message: "Task status updated successfully", task: findTask });
  } catch (error) {
    errorHandler(res, error);
  }
};

const reorderTask = async (req, res) => {
  try {
    const { taskId, newOrder } = req.body;

    // Validate input
    if (!taskId || newOrder === undefined || newOrder < 0) {
      return res.status(400).json({ message: "Invalid input parameters" });
    }

    // Find the task to reorder
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Get all tasks in the same status group, sorted by current order
    const tasks = await Task.find({ status: task.status })
      .sort({ order: 1 })
      .lean();

    // Remove the current task from the list
    const filteredTasks = tasks.filter(t => t._id.toString() !== taskId.toString());

    // Validate new position
    if (newOrder > filteredTasks.length) {
      return res.status(400).json({ message: "Invalid new position" });
    }

    // Create new ordered list
    const updatedTasks = [
      ...filteredTasks.slice(0, newOrder),
      task,
      ...filteredTasks.slice(newOrder)
    ];

    // Prepare bulk update operations
    const bulkOps = updatedTasks.map((t, index) => ({
      updateOne: {
        filter: { _id: t._id },
        update: { $set: { order: index } }
      }
    }));

    // Execute all updates in a single operation
    await Task.bulkWrite(bulkOps);

    return res.status(200).json({ 
      message: "Task reordered successfully",
      newOrder: newOrder,
      status: task.status
    });

  } catch (error) {
    errorHandler(res, error);
  }
};

//To change checklist item status
const changeChecklistItems = async (req, res, next) => {
  try {
    const { taskId, checklistItemIds,checkedItem} = req.body;

    const findTask = await Task.findById(taskId);

    if (!findTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    findTask.checklist.forEach(item => {
      if (item._id.toString() === checklistItemIds) {
        item.checked = checkedItem;
      }
    });

    await findTask.save();

    res.status(200).json({ message: "Checklist item updated", task: findTask });
  } catch (error) {
    errorHandler(res, error);
  }
};

//get all the task and group them on the basis of status
const getTask = async (req, res, next) => {
  try {
    const userId = req.user;

    const userWithTasks = await User.findById(userId).populate('tasks');

    if (!userWithTasks) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ tasks: userWithTasks.tasks });

  } catch (error) {
    errorHandler(res, error);
  }
};

const getTaskwithoutId=async(req,res,next)=>{
  try {
    const {taskId}=req.params;

    const particularTask =await Task.findById(taskId)

    if(!particularTask){
      return res.status(403).json({message:"Task not found"});
    }

    return res.status(201).json({task:particularTask});
  } catch (error) {
    errorHandler(res,error);
  }
}

const deleteTask=async(req,res,next)=>{
  try {
    const { taskId } = req.body;
    const userId = req.user;

    // Find the task
    const findTask = await Task.findById(taskId);
    if (!findTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Find the user
    const findUser = await User.findById(userId);
    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove task reference from user
    findUser.tasks = findUser.tasks.filter(
      (task) => task.toString() !== taskId
    );
    await findUser.save();
    
    // Delete task from Task model
    await Task.findByIdAndDelete(taskId);

    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    errorHandler(res,error);
  }
}

const editTask = async (req, res, next) => {
  try {
    const { task } = req.body;
    const { taskId } = req.params;
    const userId=req.user;

    const findTask = await Task.findById(taskId);

    if (!findTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    const findUser=await User.findById(userId)

    const assignedEmail=task.assigned=="None"?findUser.email:task.assigned
    // Update task fields
    findTask.taskName = task.taskName || findTask.taskName;
    findTask.assigned = assignedEmail||findTask.assigned;
    findTask.priority = task.priority || findTask.priority;
    findTask.duedate = task.duedate || findTask.duedate;
    findTask.checklist = task.checklist || findTask.checklist;
    findTask.status = task.status || findTask.status;

    await findTask.save();

    return res.status(200).json({ message: "Task updated successfully", task: findTask });
  } catch (error) {
    errorHandler(res, error);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(402).json({ message: "Task Id is required" });
    }

    const findTask = await Task.findById(taskId);

    if (!findTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(201).json({ task: findTask });
  } catch (error) {
    errorHandler(res, error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const user = req.user;
    const finduser = await User.findById(user);

    if (!finduser) {
      return res.status(404).json({ message: "User not found" });
    }

    const assignedEmail = finduser.email;

    // Get tasks assigned to the user
    const assignedTasks = await Task.find({ assigned: assignedEmail });

    // Get tasks from User.tasks (populated)
    const userWithTasks = await User.findById(user).populate("tasks");
    const userTasks = userWithTasks.tasks;

    // Combine and deduplicate tasks using a Map with _id as key
    const allTasks = [...assignedTasks, ...userTasks];
    const uniqueTasksMap = new Map();

    allTasks.forEach(task => {
      uniqueTasksMap.set(task._id.toString(), task); // .toString() for consistency
    });

    const uniqueTasks = Array.from(uniqueTasksMap.values());
    console.log("Unique tasks count:", uniqueTasks.length);

    // Counters
    const statusList = ["todo", "inprogress", "done", "backlog"];
    const priorityList = ["high", "moderate", "low"];

    const resultforstatus = statusList.reduce((acc, status) => {
      acc[status] = uniqueTasks.filter(task => task.status.toLowerCase() === status).length;
      return acc;
    }, {});

    const resultforpriority = priorityList.reduce((acc, priority) => {
      acc[priority] = uniqueTasks.filter(task => task.priority.toLowerCase() === priority).length;
      return acc;
    }, {});

    const numberofDuedate = uniqueTasks.reduce((count, task) => {
      return task.duedate && new Date(task.duedate) < new Date() ? count + 1 : count;
    }, 0);

    return res.status(200).json({
      resultforstatus,
      resultforpriority,
      numberofDuedate,
    });
  } catch (error) {
    errorHandler(res, error);
  }
};

const checkListSuggestion=async(req,res,next)=>{
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const { taskName } = req.params;
    const prompt = `Given a task titled "${taskName}", suggest 3 actionable checklist items a user might need to complete it. Return the list only in numbered format.`;
   
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Get the model instance

    const result = await model.generateContent({ // Use generateContent on the model instance
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });
   

    const response = await result.response; // Access the response part
    const rawText = response.candidates[0].content.parts[0].text; // Extract the text correctly

    const suggestions = rawText
      .split("\n")
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean);

    return res.status(200).json({ suggestions });
  } catch (error) {
    console.error("Gemini API error:", error?.response?.data || error.message);
    res.status(500).json({
      message: "AI suggestion failed",
      error: error.message,
    });
  }
}



module.exports = {
  createTask,
  changeStatus,
  getTask,
  getTaskwithoutId,
  deleteTask,
  editTask,
  changeChecklistItems,
  getTaskById,
  getAnalytics,
  checkListSuggestion,
  reorderTask
};
