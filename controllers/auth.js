const User = require('../models/user')
const bcrypt = require('bcryptjs')
const mailer = require('nodemailer')
const sendGrid = require('nodemailer-sendgrid-transport')
const crypto = require('crypto')
const user = require('../models/user')
const { findOne } = require('../models/user')
const {validationResult} = require('express-validator/check')

//set up email 
 const transport = mailer.createTransport(sendGrid({
     auth:{
         api_key:'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'
     }
 }))

exports.getLogin = (req,res,next)=>{
    let message = req.flash('error')
    if(message.length > 0){
        message = message[0]
    }else{
        message = null 
    }
    console.log(message)
      res.render('auth/login',{
            docTitle:'Login',
            path:'/login',
            errorMesage: message
        })

}

exports.postLogin = (req,res,next)=>{
    let email = req.body.email;
    let password = req.body.password
    let errors = validationResult(req)
    if(!errors.isEmpty()){
       return res.status(422).render('auth/login',{
            docTitle:'Login',
            path:'/login',
            errorMesage: errors.array()[0].msg
        })

    }
    User.findOne({email:email})
    .then(user=>{
        if(!user){
          req.flash('error','Invalid Email or Password')
          return  res.redirect('/login')
        }
        bcrypt.compare(password,user.password)
            .then(match=>{
                if(match){
                    req.session.user = user
                    req.session.isLoggedIn = true
                    return req.session.save(()=>{
                        res.redirect('/')
                    })
                    
                }
                req.flash('error','Invalid Email or Password')
                res.redirect('/login')
            })
            .catch(err=>res.redirect('/login'))
    })
    .catch(err=>{
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
     })
    
   
}

exports.getSignup = (req,res,next)=>{
    let message = req.flash('error')
    if(message.length > 0){
        message = message[0]
    }else{
        message = null 
    }
    res.render('auth/signup',{
          docTitle:'Signup',
          path:'/signup',
          errorMesage: message,
          validationErrors: []
        })

}

exports.postSignup = (req,res,next)=>{
    let email = req.body.email;
    let password = req.body.password
    let confrimPassword = req.body.confirmPassword
    let errors = validationResult(req)
    if(!errors.isEmpty()){
        console.log(errors.array())
        return res.status(422).render('auth/signup',{
            docTitle:'Signup',
            path:'/signup',
            errorMesage: errors.array()[0].msg,
            validationErrors: errors.array()
          })
    }
    bcrypt.hash(password,12)
        .then(hashedPassword=>{
            const new_user = new User({
                email:email,
                password:hashedPassword,
                cart: {items:[]}
            })
            return new_user.save()
    
        })
    .then(()=>{
        return transport.sendMail({
            to: email,
            from:'shop@jsjunkie.com',
            subject:'Signup Completed',
            html: '<h1>You have signed up with us!</h1>'
        })   
    })
    .then(mail=>{
        res.redirect('/login')
    })
    .catch(err=>{
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
     })
}

exports.postLogout = (req,res,next)=>{
    req.session.destroy()
    res.redirect('/')
}


exports.getReset = (req,res,next)=>{
    let message = req.flash('error')
    if(message.length > 0){
        message = message[0]
    }else{
        message = null 
    }
    res.render('auth/reset',{
        docTitle:'Reset Password',
        path:'/reset',
        errorMesage: message
    })
}


exports.postReset = (req,res,next) =>{
    let email = req.body.email
    crypto.randomBytes(32,(err,buffer)=>{
        if(err){
            return res.redirect('/reset')
        }
        const token = buffer.toString('hex')
        User.findOne({email: email})
        .then(user=>{
            if(!user){
                req.flash('error','No account with that email found.')
                return res.redirect('/reset')
            }
            user.resetToken = token
            user.resetTokenExpiry = Date.now() + 3600000
            return user.save()
        }).then(result=>{
            res.redirect('/')
            transport.sendMail({
                to: email,
                from:'shop@jsjunkie.com',
                subject:'Password Reset',
                html: `
                    <p> You requested a password reset </p>
                    <p> click this <a href='http://localhost:3000/reset/${token}'> link </a> to reset your password </p>
                    `
            })   

        })
        .catch(err=>{
            const error = new Error(err)
            error.httpStatusCode = 500
            return next(error)
         })
    })

}


exports.getNewPassword = (req,res,next)=>{
    let token = req.params.token
    user.findOne({resetToken: token, resetTokenExpiry:{$gt: Date.now()}})
    .then(user=>{
        let message = req.flash('error')
        if(message.length > 0){
            message = message[0]
        }else{
            message = null 
        }
        res.render('auth/new-password',{
            docTitle:'New Password',
            path:'/new-password',
            errorMesage: message,
            userId: user._id.toString(),
            passwordToken: token
        })

    }).catch(err=>{
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
     })
}


exports.postNewPassword = (req,res,next)=>{
    let password = req.body.password
    let userId= req.body.id
    let token = req.body.token
    let resetUser;

    User.findOne({resetToken: token, resetTokenExpiry:{$gt: Date.now()}})
    .then(user=>{
        resetUser = user
        return  bcrypt.hash(password,12)
    })
    .then(hashedPassword=>{
        resetUser.password = hashedPassword
        resetUser.resetToken= null
        resetUser.resetTokenExpiry =null
        return resetUser.save()
    })
    .then(results=> res.redirect('/login') )
    .catch(err=>{
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
     })

}