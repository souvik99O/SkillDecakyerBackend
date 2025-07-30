const mongoose=require("mongoose");
const {Schema}=mongoose;

const skillSchema=new Schema({
    
    userId:
    {
     type:String,
     ref:"users",
     required:true
    },
    name:
    {
        type:String,
        required:true,

    },
    category:
    {
        type:String,
        required:true
    },
    level:
    {
        type: String,
        default: "Beginner",
    },
    lastUsed: 
    {
    type: Date,
    default: Date.now
    },
  createdAt: 
    {
    type: Date,
    default: Date.now
     },

     // NEW DECAY FIELDS
    decayStatus: {
        type: String,
        enum: ['Fresh', 'Good', 'Needs Practice', 'Rusty', 'Decaying'],
        default: 'Fresh'
    },
    decayPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 1
    },
    daysSinceLastUsed: {
        type: Number,
        default: 0
    },
    lastDecayCalculation: {
        type: Date,
        default: Date.now
    }



});
skillSchema.index({ userId: 1, name: 1 }, { unique: true });

exports.Skills=mongoose.model("skills",skillSchema);


