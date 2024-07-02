const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
dotenv.config();

const User = require("../models/user");

// Error handler middleware
const errorHandler = (res, error) => {
  console.error(error);
  res.status(500).json({ error: "Internal Server Error" });
};

// Register
const registerUser = async (req, res, next) => {
  try {
    const { username, email, password, confirmpassword } = req.body;

    if (!username) {
      return res
        .status(400)
        .json({ field: "username", message: "Username is required" });
    }
    if (!email) {
      return res
        .status(400)
        .json({ field: "email", message: "Email is required" });
    }
    if (!password) {
      return res
        .status(400)
        .json({ field: "password", message: "Password is required" });
    }
    if (!confirmpassword) {
      return res
        .status(400)
        .json({
          field: "confirmpassword",
          message: "Confirm password is required",
        });
    }

    const splitedemail = email.split("@");
    if (splitedemail[0].length < 2) {
      return res
        .status(400)
        .json({ field: "email", message: "Please enter a valid email" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ field: "email", message: "User already exists" });
    }

    if (confirmpassword !== password) {
      return res
        .status(403)
        .json({
          field: "confirmpassword",
          message: "Password and confirm password should match",
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });
    await newUser.save();

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    errorHandler(res, error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ field: "email", message: "All fields are required" });
    }
    if (!password) {
      return res
        .status(400)
        .json({ field: "password", message: "password is required" });
    }

    const findUser = await User.findOne({ email });

    if (!findUser) {
      return res
        .status(403)
        .json({ field: "email", message: "User must register first" });
    }

    const comparePassword = await bcrypt.compare(password, findUser.password);

    if (!comparePassword) {
      return res
        .status(409)
        .json({ field: "password", message: "Incorrect password" });
    }

    const token = jwt.sign(
      {
        user: findUser._id,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      token,
      userId: findUser._id,
      username: findUser.username,
      email:findUser.email
    });
  } catch (error) {
    errorHandler(res, error);
  }
};

const logoutUser = async (req, res, next) => {
  try {
    const { username } = req.body;

    const findUser = User.find({ username });
    const token = jwt.sign(
      {
        user: findUser._id,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: 0 }
    );

    res.status(201).json({  success: true,
        token,
        userId: findUser._id,
        username: findUser.username,
        email: findUser.email,});
  } catch (error) {
    errorHandler(res, error);
  }
};

const addboardUser = async (req, res, next) => {
  try {
    const { email } = req.body;
    const currentUser = req.user;

    console.log(email);
    console.log(currentUser);

    const findUser = await User.findById(currentUser);
    if (!findUser) {
      return res.status(403).json({ message: "User not found" });
    }

    const addedUser = await User.findOne({ email: email });
    if (!addedUser) {
      return res.status(404).json({ message: "Added user not found" });
    }

    const userId = addedUser._id;
    findUser.boardUsers.push({ userId, email });
    await findUser.save();

    return res.status(200).json({ message: "Board user added successfully" });
  } catch (error) {
    errorHandler(res, error);
  }
};

const getBoardUsers = async (req, res, next) => {
  try {
    const user = req.user;

    const findUser = await User.findById(user);

    if (!findUser) {
      return res.status(404).json({ message: "User not founr" });
    }

    return res.status(200).json({ allBoardUsers: findUser.boardUsers });
  } catch (error) {
    errorHandler(res, error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(404)
        .json({ message: "old password and new password are required" });
    }

    const userId = req.user;
    const findUser = await User.findById(userId);
    console.log(findUser);

    if (!findUser) {
      return res.status(403).json({ message: "User not found" });
    }

    const comparePassword = await bcrypt.compare(
      oldPassword,
      findUser.password
    );

    if (!comparePassword) {
      return res.status(403).json({ message: "old password is not correct" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    findUser.password = hashedPassword;

    await findUser.save();

    return res.status(201).json({ message: "password change successfully" });
  } catch (error) {
    errorHandler(res, error);
  }
};

const getEmailById = async (req, res, next) => {
  try {
    const { assignedId } = req.params;
    console.log(assignedId);
    const findUser = await User.findById(assignedId);

    console.log("user-", findUser);
    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(201).json({ email: findUser.email });
  } catch (error) {
    errorHandler(res, error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  addboardUser,
  getBoardUsers,
  changePassword,
  getEmailById,
};
