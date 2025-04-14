const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
dotenv.config();

const Task = require("../models/task");
const User = require("../models/user");
const user = require("../models/user");

// Error handler middleware
const errorHandler = (res, error) => {
  console.error(error);
  res.status(500).json({ error: "Internal Server Error" });
};

//to create a new Task
const createTask = async (req, res, next) => {
  try {
    const { taskName, description,dueDate,status } = req.body;

    const userId = req.user;
    if(!taskName){
      return res.status(404).json({message:"please provide title"})
    }
    if(!description){
      return res.status(404).json({message:"please provide priority"})
    }
    if(!status){
      return res.status(404).json({message:"please provide status"})
    }
    console.log("dueDate",dueDate)

    const newTask = new Task({
      taskName,
      description,
      status,
      duedate:dueDate
    });

    const savedTask = await newTask.save();

    //saving under the person who is creating the task
    const findLoginedUser = await User.findById(userId);

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



module.exports = {
  createTask,
  changeStatus,
  getTask,
  getTaskwithoutId,
  deleteTask,
  editTask
};
