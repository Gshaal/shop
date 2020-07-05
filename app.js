const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs')
//for file upload 
const multer = require('multer')
const fileStorage = multer.diskStorage({
    destination: (req,file,cb)=>{
        cb(null,'images')
    },
    filename:(req,file,cb)=>{
        cb(null, new Date().toISOString().replace(/:/g, '-') + '_' + file.originalname)
    }
})

const fileFilter = (req,file,cb)=>{
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' ){
        cb(null,true)
    }else {
        cb(null,false)
    }

}
//controllers for path
const admin = require('./routes/admin');
const shop = require('./routes/shop');
const auth = require('./routes/auth')

const error_controller =require('./controllers/error')

//db
const mongoose = require('mongoose')
// user : root
//password: 2113321Nopro
const MONGODB_URL = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-uehrt.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`
//session 

const session = require('express-session')

//session store
const MongoDbStore = require('connect-mongodb-session')(session)
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
//csurf

const csrf = require('csurf')

const flash = require('connect-flash')

//user modal 

const User = require('./models/user');
const { request } = require('http');


//the app


const app = express();



const store = new MongoDbStore({
    uri:MONGODB_URL,
    collection: 'sessions'
})
const csrfProtection = csrf();
app.set('view engine', 'ejs');
app.set('views', 'views');


//secure headers 

app.use(helmet())
//compress files 

app.use(compression())

//request logs
const accessLogs = fs.createWriteStream(path.join(__dirname,'access.log'),{flags:'a'})
app.use(morgan('combined', {stream: accessLogs}))

app.use(bodyParser.urlencoded({extended:false}));
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'))
app.use(express.static(path.join(__dirname, 'public')))
app.use('/images',express.static(path.join(__dirname, 'images')))
app.use(session({
    secret:'my secret',
    resave:false,
    saveUninitialized:false,    
    store:store
}))

app.use(csrfProtection)

app.use(flash())

app.use((req,res,next)=>{
    if (!req.session.user){
        return next()
    }
    User.findById(req.session.user._id)
    .then(user=>{
        if(!user){
            return next()
        }
        req.user = user
        next()
    })
    .catch(err=> {
        next(new Error(err))
    })
})

app.use((req,res,next)=>{
    res.locals.isAuthinticated = req.session.isLoggedIn
    res.locals.token = req.csrfToken()
    next()
})

app.use('/admin',admin);

app.use(shop);

app.use(auth)

app.get('/500',error_controller.get500)

app.use(error_controller.get404)

//error handling middleware 

app.use((error,req,res,next)=>{
    console.log(error)
    res.redirect('/500')
})

mongoose.connect(MONGODB_URL)
    .then(()=> {
        app.listen(process.env.PORT || 3000)
    })
    .catch(err=>console.log(err))