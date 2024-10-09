import mongoose from "mongoose";


var user = mongoose.Schema({
    //id: Number,
    username: String,
    email: String,
    password: String,
}
)

export default mongoose.model('user', user) ;
