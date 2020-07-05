const express = require('express');
const path = require('path');
const router = express.Router();
const auth_controller = require('../controllers/auth')
const {check, body} = require('express-validator/check')
const User = require('../models/user')

router.get('/login',auth_controller.getLogin)

router.post('/login',
[check('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
    check('password','Password is incorrect')
    .isLength({min:5})
    .isAlphanumeric()
    .trim()
]
,auth_controller.postLogin)

router.get('/signup',auth_controller.getSignup)

router.post('/signup',
 [check('email')
 .isEmail()
 .withMessage('Please enter a valid email')
 .normalizeEmail()
 .custom((val,{req})=>{
    return User.findOne({email:val})
    .then(user=>{
        if(user){
          return  Promise.reject('E-Mail already exists, please pick a diffrent one.')
        }
    })
 }),
 body('password','please enter a password with numbers and text and at least 5 charachters long')
 .isLength({min:5})
 .isAlphanumeric()
 .trim(),
 body('confirmPassword')
 .trim()
 .custom((val,{req})=>{
     if(val !== req.body.password){
         throw new Error('Passwords have to match!')
     }
     return true
 })

]
  ,auth_controller.postSignup)

router.post('/logout',auth_controller.postLogout)


router.get('/reset',auth_controller.getReset)

router.post('/reset',auth_controller.postReset)


router.get('/reset/:token',auth_controller.getNewPassword)

router.post('/reset-password',auth_controller.postNewPassword)




module.exports = router