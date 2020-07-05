const express = require('express');
const router = express.Router();
const shop_controller = require('../controllers/shop')
const protected = require('../middleware/is-auth')


router.get('/', shop_controller.getIndex)

router.get('/products', shop_controller.getProducts)



router.get('/product/:productId', shop_controller.getProduct)

router.get('/cart',shop_controller.getCart)


router.post('/cart', protected,shop_controller.postCart)

router.post('/cart-delet-item',protected,shop_controller.postCartDelete)

router.get('/orders',protected,shop_controller.getOrders)

router.post('/create-order',protected,shop_controller.postOrder)

router.get('/checkout', protected,shop_controller.getCheckout)

router.get('/checkout/success', protected,shop_controller.postOrder)

router.get('/checkout/cancel', protected,shop_controller.getCheckout)

router.get('/orders/:orderId', protected,shop_controller.getInvoice)



module.exports = router