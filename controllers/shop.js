const Product = require('../models/product');
const Order = require('../models/order')
const fs = require('fs')
const path = require('path')
const pdfDocument = require('pdfkit')
const stripe = require('stripe')(process.env.STRIPE_KEY)
const ITEM_PER_PAGE = 2

exports.getProducts = (req,res,next)=>{    
    const page = +req.query.page || 1
    let totalItems;
    Product.find().countDocuments()
        .then(number =>{
            totalItems = number
            return Product.find()
            .skip((page -1) * ITEM_PER_PAGE)
            .limit(ITEM_PER_PAGE)
        })
       .then(rows=>{
        res.render('shop/product-list',{
            pord:rows,
            docTitle:'All Products', 
            path:'/products',
            currentPage: page,
            hasNextPage: ITEM_PER_PAGE * page < totalItems,
            hasPrePage: page > 1,
            nextPage: page + 1,
            prevPage: page - 1,
            lastPage: Math.ceil(totalItems/ITEM_PER_PAGE)
        })
        }).catch(err=> console.log(err))
    
}

exports.getProduct = (req,res,next)=>{
    const id = req.params.productId
    Product.findById(id)
    .then((rows)=>{
        res.render('shop/product-detail',{
            docTitle: rows.title,
            product: rows,
           
            path:'/products'
           })
    
    }).catch(err=> console.log(err))
    
}


exports.getIndex = (req,res,next)=>{
    const page = +req.query.page || 1
    let totalItems;
    Product.find().countDocuments()
        .then(number =>{
            totalItems = number
            return Product.find()
            .skip((page -1) * ITEM_PER_PAGE)
            .limit(ITEM_PER_PAGE)
        })
       .then(rows=>{
        res.render('shop/index',{
            pord:rows,
            docTitle:'Shop', 
            path:'/',
            currentPage: page,
            hasNextPage: ITEM_PER_PAGE * page < totalItems,
            hasPrePage: page > 1,
            nextPage: page + 1,
            prevPage: page - 1,
            lastPage: Math.ceil(totalItems/ITEM_PER_PAGE)
        })
    }).catch(err=> console.log(err))
    
    
}

exports.getCart= (req,res,next)=>{
    req.user.populate('cart.items.productId')
    .execPopulate()
    .then(cart=>{
        res.render('shop/cart',{
            pord:cart.cart.items,
            docTitle:'Cart',
           
            path:'/cart'
        })
        })
        .catch(err=> console.log(err))
       
    .catch(err=>{
        console.log(err)
    })
  }



exports.postCart= (req,res,next)=>{
    const id = req.body.id 
    Product.findById(id) 
    .then(product=>{
        return req.user.addToCart(product)
    })
    .then(result => res.redirect('/cart'))
    .catch(err=> console.log(err))
  
}


exports.postCartDelete= (req,res,next)=>{
    const id = req.body.id
    req.user.deleteItemsFromCart(id)
    .then(result => res.redirect('/cart'))
    .catch(err=> console.log(err))
}


exports.getOrders = (req,res,next)=>{
    Order.find({'user.userId': req.user._id})
    .then(orders=>{
        console.log(orders)
        res.render('shop/orders',{
            docTitle:'My Order', 
           
            path:'/orders',
            orders:orders
        })
    })
    .catch(err=>console.log(err)) 
}


exports.postOrder = (req,res,next)=>{
    req.user.populate('cart.items.productId')
    .execPopulate()
    .then(cart=>{
        const items = cart.cart.items.map(i=>{
            return{
                product: {...i.productId._doc},
                qty: i.qty
            }
        })
        const order = new Order({
            products: items,
            user:{
                email: req.user.email,
                userId: req.user._id
            }
        })
       return order.save()
    })
    .then(()=> {
       return req.user.clearCart()
    })
    .then(()=> res.redirect('/orders'))
    .catch(err=> console.log(err))
  
}


exports.getInvoice= (req,res,next)=>{
  const orderId = req.params.orderId
  Order.findById(orderId)
  .then(order=>{
     
        if(!order){
            return next(new Error('No Order found'))
        }
        if(order.user.userId.toString() !== req.user._id.toString()){

            return next(new Error('not authorize'))

        }
        const invoiceName = 'invoice-'+ orderId +'.pdf'
        const invoicePath = path.join('data', 'invoices', invoiceName)
        //create pdf on the fly =>
        const pdf = new pdfDocument()
        res.setHeader('Content-Type','application/pdf')
        res.setHeader('Content-Disposition','inline; filename="'+invoiceName+'"') 
        pdf.pipe(fs.createWriteStream(invoicePath))
        pdf.pipe(res)
        pdf.fontSize(26).text('Invoice',{
            underline:true
        })
        pdf.text('------------------------------------------------')
        let total = 0
        order.products.forEach(element => {
            total += element.qty * element.product.price
            pdf.fontSize(14).text(element.product.title + ' - ' + element.qty + ' x' + '$' + element.product.price)
        });
        pdf.text('-----------')
        pdf.fontSize(20).text('Total Price: $' + total)
        pdf.end()
        //preload data =>
       /* fs.readFile(invoicePath,(err,data)=>{
          if(err){
             return next(err)
          }
          res.setHeader('Content-Type','application/pdf')
          res.setHeader('Content-Disposition','inline; filename="'+invoiceName+'"') 
          res.send(data)
        })  */

        //streaming data =>

       /* const file = fs.createReadStream(invoicePath)
        res.setHeader('Content-Type','application/pdf')
        res.setHeader('Content-Disposition','inline; filename="'+invoiceName+'"') 
        file.pipe(res) */
  })
  .catch(err=> next(err))
    
}


exports.getCheckout= (req,res,next)=>{
    let product;
    let total = 0
    req.user.populate('cart.items.productId')
    .execPopulate()
    .then(cart=>{
        product = cart.cart.items
        cart.cart.items.forEach(item =>{
            total += item.qty + item.productId.price
        })

        return stripe.checkout.sessions.create({
            payment_method_types:['card'],
            line_items:product.map(p=>{
                return{
                    name:p.productId.title,
                    description: p.productId.description,
                    amount:p.productId.price * 100,
                    currency:'usd',
                    quantity:p.qty
                }
            }),
            success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
            cancel_url:req.protocol + '://' + req.get('host') + '/checkout/cancel'
        })
    }).then((session)=>{
            res.render('shop/checkout',{
                pord:product,
                docTitle:'Checkout',
                path:'/checkout',
                totalSum:total,
                sessionId:session.id
            })
        })
      .catch(err=>{
        next(new Error(err))
    })
  }




