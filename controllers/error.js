exports.get404 = (req,res,next)=>{
    res.status(404).render('404',{docTitle:'404',path:''})
 }
 exports.get500 = (req,res,next)=>{
    res.status(500).render('500',{docTitle:'Error',path:'/500'})
 }