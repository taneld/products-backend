import mongoose from 'mongoose';

let Product = new mongoose.Schema({
	name: {
		type: String,
	},
	description: {
		type: String,
	},
	price: {
		type: Number,
		min: 0,
	},
	categories: {
		type: Array,
		of: String,
	},
});

export default mongoose.model('Product', Product);
