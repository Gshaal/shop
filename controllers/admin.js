const Product = require('../models/product');
const {validationResult} = require('express-validator/check')
const fileHelper = require('../util/file')

exports.getAddproduct = (req,res,next)=>{

    res.render('admin/edit-product', {
        docTitle:'Add Product',
        path:'/admin/add-product',
        hasError: false,
        editing:false,
        errorMesage:null
    })
 }

 exports.postAddproduct = (req,res,next)=>{
    const title = req.body.title;
    const imageUrl = req.file;
    const dics = req.body.description;
    const price = req.body.price;
    const errors = validationResult(req)
    if (!imageUrl){
        return  res.status(422).render('admin/edit-product', {
            docTitle:'Add Product',
            path:'/admin/add-product',
            editing:false,
            hasError: true,
            product: {
                title:title,
                description:dics,
                price:price
            },
            errorMesage: 'Attached file is not an image'

        })

    }

    const imagePath = imageUrl.path
    
    if(!errors.isEmpty()){
      return  res.status(422).render('admin/edit-product', {
            docTitle:'Add Product',
            path:'/admin/add-product',
            editing:false,
            hasError: true,
            product: {
                title:title,
                description:dics,
                price:price
            },
            errorMesage: errors.array()[0].msg

        })
    }
    const product = new Product({
        title:title,
        price:price,
        imageUrl:imagePath,
        description:dics,
        userId: req.user._id
    });
    product
    .save()
    .then(result=>{
        res.redirect('/admin/products')
    }).catch(err=>{
        console.log(err)
       //const error = new Error(err)
       //error.httpStatusCode = 500
       //return next(error)
    })
}

exports.getEditproduct = (req,res,next)=>{
    const editMode = req.query.edit
    if(!editMode){
        return res.redirect('/')
    }
    const id = req.params.id;
    
    Product.findById(id)
        .then(pro=>{
            if(!pro){
                return res.redirect('/')
            }
            
            res.render('admin/edit-product', {
                docTitle:'Edit Product',
                path:'/admin/add-product',
                hasError: false,
                editing : editMode,
                product: pro,
                errorMesage:null
            })

      }).catch(err=>{
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
     })

 }



 exports.postEditproduct = (req,res,next)=>{
    const id = req.body.id;
    console.log(id)
    const title = req.body.title;
    const imageUrl = req.file;
    const dics = req.body.description;
    const price = req.body.price;
    const errors = validationResult(req)
    if(!errors.isEmpty()){

        return  res.status(422).render('admin/edit-product', {
            docTitle:'Edit Product',
            path:'/admin/add-product',
            editing:true,
            hasError: true,
            product: {
                title:title,
                description:dics,
                price:price,
                _id:id
            },
            errorMesage: errors.array()[0].msg

        })

    }

    Product.findById(id).then(product=>{
        console.log(product)
        if(product.userId.toString() !== req.user._id.toString()){
            return res.redirect('/')
        }
        product.title =title
        product.price =price
        product.description =dics
        product.userId = req.user._id
        if(imageUrl){
            fileHelper.deleteFile(product.imageUrl)
            product.imageUrl = imageUrl.path
        }
        return product.save()
        .then(result=>{
            res.redirect('/admin/products')
         })
     })
     .catch(err=>{
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
     })
 } 

exports.getProducts = (req,res,next)=>{
    Product.find({userId:req.user._id}).then(rows=>{
        res.render('admin/products',{
            pord:rows,
            docTitle:'Admin Products',
            
            path:'/admin/products'})
    }).catch(err=>{
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
     })
}

exports.PostDeleteProduct = (req,res,next)=>{
    const id = req.params.id;
    Product.findById(id).then(product=>{ 
        if(!product) {return next(new Error('No Product Found'))} fileHelper.deleteFile(product.imageUrl) ; return Product.deleteOne({_id:id,userId:req.user._id}) })
    .then(()=>{
        res.status(200).json({message : 'Updated!'})
    })
    .catch(err=>{
       res.status(500).json({message : 'failed!'})
     })
    
}
