const mongoose=require('mongoose')

const checklistSchema=new mongoose.Schema({
    checked:{
        type:Boolean,
        default:false
    },
    description:{
        type:String,
        required:true
    }
})

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
        enum:['todo', 'backlog', 'done','inprogress'],
        default:'todo'
    },
    checklist:[checklistSchema],
    assigned:{
        type:String
    },
    priority:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now()
    }
})

module.exports=mongoose.model('Task',taskSchema)