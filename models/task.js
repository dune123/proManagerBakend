const mongoose=require('mongoose')

const checklistItemSchema = new mongoose.Schema({
    checked: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        required: true
    }
});

const taskSchema=new mongoose.Schema({
    taskName:{
        type:String,
        required:true
    },
    assigned:{
        type:String
    },
    assignedEmail:{
        type:String,
    },
    priority:{
        type:String,
        required:true
    },
    dueDate:{
        type:Date
    },
    checklist:[checklistItemSchema],
    status:{
        type:String
    },
    createAt:{
        type:Date,
        default:Date.now()
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
})

module.exports=mongoose.model('Task',taskSchema)