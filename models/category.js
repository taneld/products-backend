import mongoose from 'mongoose';

let Category = new mongoose.Schema({
    name: {
        type: String,
    },
});

export default mongoose.model('Category', Category);
