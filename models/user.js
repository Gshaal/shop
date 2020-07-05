const mongoose = require('mongoose')

const Schema = mongoose.Schema

const userSchema = new Schema({
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    resetToken: String,
    resetTokenExpiry: Date,
    cart:{
        items:[{productId:{type:Schema.Types.ObjectId, ref:'Product',required:true }, qty:{type:Number,required:true}}]
    }
})

userSchema.methods.addToCart = function(product){

    const  userCart =  this.cart.items.findIndex(cp=> cp.productId.toString() === product._id.toString()) 
        const updatedCart =[...this.cart.items]
        let newQty = 1
        if(userCart >= 0){
            newQty = this.cart.items[userCart].qty + 1
            updatedCart[userCart].qty = newQty
        }else{
            updatedCart.push({productId: product._id, qty: newQty})
        }
        let newCart = {
            items: updatedCart
        }
        this.cart = newCart
        return this.save()

}

userSchema.methods.deleteItemsFromCart = function(id){
    const updatedCartItems = this.cart.items.filter(item =>{
        return item.productId.toString() !== id.toString();
    })

    this.cart.items = updatedCartItems
    return this.save()
}


userSchema.methods.clearCart = function(){
    this.cart = {items: []}
    return this.save()
}
/*
class User {
    constructor(name,email,cart,userId){
        this.name =name 
        this.email= email 
        this.cart = cart
        this.userId = userId
    }

    save(){
        const db = getDb()
       return db.collection('users').insertOne(this)

    }

    addToCart(product){
        
    }


    getCart(){
        const db = getDb()
        const porductsIds = this.cart.items.map(item =>{
           return item.productId
        })
        return db.collection('products')
        .find({_id:{$in: porductsIds}})
        .toArray()
        .then(pros =>{
            return pros.map(p=>{
                return {
                    ...p,
                    qty: this.cart.items.find(i=> i.productId.toString() === p._id.toString()).qty
                }
            })
        })
    }

    deleteItemsFromCart(id){
        const updatedCartItems = this.cart.items.filter(item =>{
            return item.productId.toString() !== id.toString();
        })
        const db = getDb()
        return db.collection('users')
        .updateOne(
            {_id: new mongodb.ObjectId(this.userId)},
            {$set:{ cart:{items:updatedCartItems}}}
            
            )
    }

    addOrder(){
        const db = getDb()
       return this.getCart().then(products=>{

            let order = {
                items: products,
                user:{
                    _id: new mongodb.ObjectId(this.userId),
                    name: this.name,
                    email: this.email
    
                }
            }
            return db.collection('orders').insertOne(order)

        })
            .then(results=>{
                this.cart = {items:[]}
                return db.collection('users')
                .updateOne(
                {_id: new mongodb.ObjectId(this.userId)},
                {$set:{ cart:{items:[]}}}
                
                )
            })

    }


    getOrders(){
        const db = getDb()
        return db.collection('orders').find({'user._id': new mongodb.ObjectId(this.userId)}).toArray()
    }


    static findByid(userId){
        const db = getDb()
        return db.collection('users').findOne({_id: new mongodb.ObjectId(userId)})
        .then(user=> user)
        .catch(err=> console.log(err))

    }
}

*/

module.exports = mongoose.model('User',userSchema)