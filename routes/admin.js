const express = require('express');
const path = require('path');
const router = express.Router();
const admin_controller = require('../controllers/admin')
const protected = require('../middleware/is-auth')
const {check, body} = require('express-validator/check')


router.get('/add-product', protected, admin_controller.getAddproduct)

router.post('/add-product', [
    body('title')
    .isString()
    .isLength({min: 3})
    .trim(),
    body('price')
    .isFloat(),
    body('description')
    .isLength({min:5, max:400})
    .trim()
] ,protected, admin_controller.postAddproduct)

router.get('/products', protected,admin_controller.getProducts)  

router.get('/edit-product/:id',protected,admin_controller.getEditproduct)  


router.post('/edit-product',[
    body('title')
    .isString()
    .isLength({min: 3})
    .trim(),
    body('price')
    .isFloat(),
    body('description')
    .isLength({min:5, max:400})
    .trim()
],protected,admin_controller.postEditproduct);


router.delete('/delete-product/:id',protected,admin_controller.PostDeleteProduct); 


module.exports = router