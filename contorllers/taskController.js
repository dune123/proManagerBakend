const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
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
    const { title, assignTo, priority, dueDate, checklist } = req.body;

    const userId = req.user;

    const newTask = new Task({
      taskName: title,
      assigned:assignTo,
      priority,
      dueDate,
      checklist,
      status: "To Do",
      createdAt: Date.now(),
      createdBy: userId,
    });

    const savedTask = await newTask.save();

    //saving under the person who is creating the task
    const findLoginedUser = await User.findById(userId);

    findLoginedUser.tasks.push(savedTask._id);

    await findLoginedUser.save();

    //saving under the person who has been assigned to the task
    if(assignTo!==findLoginedUser.email){
    const assigneduser = await User.find({email:assignTo});

    if (!assigneduser) {
      return res.status(404).json({ message: "Assigned user not found" });
    }

    assigneduser.tasks.push(savedTask._id);
    await assigneduser.save();
  }

    return res
      .status(201)
      .json({
        message: "Task created and assigned successfully",
        task: savedTask,
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

//get all the task and group them on the basis of status
const getTask = async (req, res, next) => {
  try {
    const userId = req.user;

    const {filter}=req.params;

    const finduser = await User.findById(userId);
    if (!finduser) {
      return res.status(404).json({ message: "User not found" });
    }

    let createdTasks = await Task.find({ createdBy: userId });
    let assignedTasks = await Task.find({ assignTo: finduser.email });

    let tasks = [...createdTasks, ...assignedTasks];

    //filter the tasks according to there week assets
      function filterTaskByDate(filter, tasks) {
        let startDate, endDate;
    const now = new Date();
    endDate = new Date();
    
    if (filter === "Today") {
      startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0); }
       else if(filter==="This Week"){
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        } else if (filter === "This Month") {
        startDate = new Date(endDate);
        startDate.setMonth(endDate.getMonth() - 1);
        }
    
        let newTasklist = [];
    
        tasks.forEach((task) => {
            const createdDate = new Date(task.createAt);
            if (createdDate >= startDate && createdDate <= endDate) {
                newTasklist.push(task);
            }
        });
        
        return newTasklist;
    }
  
  const filteredTask = filterTaskByDate(filter, tasks);

    //group task according to there status
    const groupTask = filteredTask.reduce((acc, task) => {
      const status = task.status; 
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(task);
      return acc;
    }, {});

    return res
      .status(201)
      .json({ message: "all the task for this user", tasks: groupTask });
  } catch (error) {
    errorHandler(res, error);
  }
};


//get analytics sections
const getanalytics = async (req, res, next) => {
  try {
    const user = req.user;

    const finduser = User.findById(user);
    if (!finduser) {
      return res.status(404).json({ message: "User not found" });
    }

    const status = ["To Do", "In Progress", "Done", "Backlog"];

    let resultforstatus = {};
    for (let i of status) {
      let currentCnt = await Task.countDocuments({ status: i });


      if(i==="In Progress") {
      resultforstatus["Inprogress"] = currentCnt;
      }
      else if(i==="To Do") {
        resultforstatus["Todo"] = currentCnt;
      }
      else{
        resultforstatus[i] = currentCnt;
      }
    }

    const priority = ["high", "low", "moderate"];
    let resultforpriority = {};
    for (let i of priority) {
      let currentCnt = await Task.countDocuments({ priority: i });

      resultforpriority[i] = currentCnt;
    }

    let numberofDuedate = 0;
    const TaskByUser = await Task.find({ createdBy: user });

    for (let i in TaskByUser) {
      if (TaskByUser[i].dueDate !== null) {
        let currentNumber = TaskByUser[i].dueDate < Date.now() ? 1 : 0;

        numberofDuedate =numberofDuedate+currentNumber;
      }
    }

    return res
      .status(200)
      .json({
        resultforstatus: resultforstatus,
        resultforpriority: resultforpriority,
        numberofDuedate: numberofDuedate,
      });
  } catch (error) {
    errorHandler(res, error);
  }
};

//checklist item done
const changeChecklistStatus = async (req, res, next) => {
  try {
    const userId = req.user;
    const { taskId, number } = req.body;

    // Find the user
    const findUser = await User.findById(userId);
    if (!findUser) {
      return res.status(403).json({ message: "User not found" });
    }

    // Find the task
    const findTask = await Task.findById(taskId);
    if (!findTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if the checklist item exists
    if (number >= findTask.checklist.length) {
      return res.status(400).json({ message: "Checklist item not found" });
    }

    // Toggle the checked status
    findTask.checklist[number].checked = !findTask.checklist[number].checked;

    // Save the updated task to persist the change
    await findTask.save();

    return res.status(200).json(findTask);
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

const findTask = await Task.findById(taskId);
if (!findTask) {
  return res.status(404).json({ message: "Task not found" });
}

const { createdBy, assigned } = findTask;

const findUser = await User.findById(createdBy);
if (!findUser) {
  return res.status(404).json({ message: "User not found" });
}

if (assigned && assigned !== findUser.email) {
  const findAssignedUser = await User.findOne({ email: assigned });
  if (findAssignedUser) {
    findAssignedUser.tasks = findAssignedUser.tasks.filter(
      (task) => task.toString() !== taskId
    );
    await findAssignedUser.save();
  }
}

findUser.tasks = findUser.tasks.filter((task) => task.toString() !== taskId);
await findUser.save();

await Task.findByIdAndDelete(taskId);

return res.status(201).json({ message: "Task deleted successfully" });
  } catch (error) {
    errorHandler(res,error);
  }
}

const editTask = async (req, res, next) => {
  try {
    const { task } = req.body;
    const { taskId } = req.params;

    const findTask = await Task.findById(taskId);

    if (!findTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Update task fields
    findTask.taskName = task.taskName || findTask.taskName;
    findTask.assigned = task.assigned || findTask.assigned;
    findTask.priority = task.priority || findTask.priority;
    findTask.dueDate = task.dueDate || findTask.dueDate;
    findTask.checklist = task.checklist || findTask.checklist;
    findTask.status = task.status || findTask.status;

    await findTask.save();

    return res.status(200).json({ message: "Task updated successfully", task: findTask });
  } catch (error) {
    errorHandler(res, error);
  }
};

const changeChecklistDone=async(req,res,next)=>{
  try {
    const {taskId}=req.params;

    const findTask = await Task.findById(taskId)
    
    if(!findTask){
      return res.status(403).json({message:"Task Not Found"})
    }

    const {checklistItemId,isChecked} = req.body;
    console.log(checklistItemId)
    console.log(isChecked)
    // Find the checklist item in the task's checklist array
    const checklistItem = findTask.checklist.find(item => item._id.toString() === checklistItemId);

    if (!checklistItem) {
      return res.status(404).json({ message: "Checklist Item Not Found" });
    }

    checklistItem.checked = isChecked;

    // Save the updated task
    await findTask.save();

    return res.status(201).json({message: "Task updated"});
  } catch (error) {
    errorHandler(res, error);
  }
}

module.exports = {
  createTask,
  changeStatus,
  getTask,
  getanalytics,
  changeChecklistStatus,
  getTaskwithoutId,
  deleteTask,
  editTask,
  changeChecklistDone
};
