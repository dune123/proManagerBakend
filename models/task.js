const mongoose=require('mongoose')


const taskSchema=new mongoose.Schema({
    taskName:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    duedate:{
        type:Date,
        required:true
    },
    status:{
        type:String,
        enum:['todo', 'backlog', 'done'],
        default:'todo'
    }
})

module.exports=mongoose.model('Task',taskSchema)