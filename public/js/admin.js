
const deleteProduct = (btn)=>{
    let id = btn.parentNode.querySelector('[name=id]').value
    let csrf = btn.parentNode.querySelector('[name=_csrf]').value
    let element = btn.closest('article')
    fetch('/admin/delete-product/'+ id, {
        method:'DELETE',
        headers:{
            'csrf-token':csrf
        }
    }).then(res=>{

       return res.json()

    }).then(response=>{
        element.parentNode.removeChild(element)
    })
    .catch(err=> console.log(err))
    
}