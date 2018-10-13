import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';

import Category from './models/category';
import Product from './models/product';

const app = express();
const router = express.Router();
app.use(cors());
app.use(bodyParser.json());
app.use('/', router);

// === SETUP

mongoose.connect('mongodb://localhost:27017/products-backend', {
    useNewUrlParser: true
});

mongoose.connection.once('open', () => {
    console.log('MongoDB connection established');
});

app.listen(4000, () => console.log('Express server running on port 4000'));


// === CATEGORIES

// Get all
router.route('/categories').get((req, res) => {
    Category.find((err, categories) => {
        if (err) {
            console.log(err);
            res.status(400).send('Failed to fetch records');
        } else {
            res.json(categories);
        }
    })
});

// Create
router.route('/categories/add').post((req, res) => {
	const name = req.body.name.trim();
    Category.find({
        name: new RegExp('^' + name + '$', 'i')
    })
    .then(items => {
        if (items.length) {
            res.status(409).send('Category with that name already exists!');
        } else {
            let category = new Category({
                name: name
            });

            category.save()
                .then(issue => {
                    res.status(200).json(category);
                })
                .catch(err => {
                    res.status(400).send('Failed to create new record');
                });
        }
    })
    .catch(err => {
        console.log('Error on check category name: ', err);
        res.status(400).send('Failed to perform operation');
    });
});

// Delete
// Also, remove given category from related products
// Since there's 0 .. many relation, it's OK to have products without categories
router.route('/categories/delete/:id').delete((req, res) => {
    Product.find()
		.then(products => {
			var saves = [];
			products.forEach(product => {
				const idx = product.categories.indexOf(req.params.id)
				if (idx > -1) {
					product.categories.splice(idx, 1);
					saves.push(product.save());
				}
			});

			return Promise.all(saves);
		})
		.then(() => {
			return Category.findOneAndDelete({_id: req.params.id});
		})
		.then(record => {
			res.json(record);
		})
		.catch(err => {
			console.log('Error on check category name: ', err);
			res.status(400).send('Failed to perform operation');
		});
});

// Update
router.route('/categories/update/:id').put((req, res) => {
    const name = req.body.name.trim();
	// Exclude updatable record from search - this allows to change case
    Category.find({
        name: new RegExp('^' + name + '$', 'i'),
		_id: {$ne: req.params.id}
    })
    .then(items => {
        if (items.length) {
            res.status(409).send('Category with that name already exists!');
        } else {
            genericUpdate(Category, req, res);
        }
    })
    .catch(err => {
        res.status(400).send('Operation failed');
    });
});


// === PRODUCTS

// Get all
router.route('/products').get((req, res) => {
    Product.find((err, products) => {
        if (err) {
            console.log('Error on get: ', err);
            res.status(400).send('Failed to fetch records');
        } else {
            res.json(products);
        }
    })
});

// Get by id
router.route('/products/:id').get((req, res) => {
    Product.findById(req.params.id, (err, products) => {
        if (err) {
            console.log('Error on get: ', err);
            res.status(400).send('Failed to fetch record');
        } else {
            res.json(products);
        }
    })
});

// Create
router.route('/products/add').post((req, res) => {
    genericCreate(Product, req, res);
});

// Update
router.route('/products/update/:id').put((req, res) => {
    genericUpdate(Product, req, res);
});

// Delete
router.route('/products/delete/:id').delete((req, res) => {
    genericDelete(Product, req, res);
});


// === GENERIC HELPERS

// Create
const genericCreate = function(model, req, res) {
    let record = new model(req.body);

    record.save()
        .then(record => {
            res.json(record);
        })
        .catch(err => {
            console.log('Error on create: ', err);
            res.status(400).send('Failed to create new record');
        });
}

// Update
const genericUpdate = function(model, req, res) {
    model.findById(req.params.id)
        .then(record => {
            if (!record) {
                throw 'Record not found';
            }
            Object.assign(record, req.body);
            return record.save();
        })
        .then(record => {
            res.json(record);
        })
        .catch(err => {
            console.log('Error on update: ', err);
            res.status(400).send('Update failed');
        });
}

// Delete
const genericDelete = function(model, req, res) {
    model.findOneAndDelete({_id: req.params.id})
        .then(record => {
            res.json(record);
        })
        .catch(err => {
            console.log('Error on delete: ', err);
            res.status(400).send('Delete failed');
        });
}
