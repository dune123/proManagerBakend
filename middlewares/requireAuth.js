const jwt=require('jsonwebtoken')
const dotenv=require('dotenv')
dotenv.config()

const requireAuth=(req,res,next)=>{
    const authHeader=req.header("Authorization")

    if(!authHeader){
        return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(' ')[1];
    if(!token){
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded=jwt.verify(token,process.env.JWT_SECRET_KEY)
        req.user=decoded.user
        next()
    } catch (error) {
        console.log(error);
        res.status(400).json({message:"Unauthorized"})
    }
}


module.exports = requireAuth;