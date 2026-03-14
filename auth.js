let express = require('express')
let router = express.Router()
let userController = require('../controllers/users')
let { RegisterValidator, validatedResult } = require('../utils/validator')
let bcrypt = require('bcrypt')
let jwt = require('jsonwebtoken')
const { check, body, validationResult } = require('express-validator')
const fs = require('fs')
const path = require('path')
const { checkLogin } = require('../utils/authHandler')

const privateKey = fs.readFileSync(path.join(__dirname, '../private.key'), 'utf8');

router.post('/register', RegisterValidator, validatedResult, async function (req, res, next) {
    let { username, password, email } = req.body;
    let newUser = await userController.CreateAnUser(
        username, password, email, '69b2763ce64fe93ca6985b56'
    )
    res.send(newUser)
})
router.post('/login', async function (req, res, next) {
    let { username, password } = req.body;
    let user = await userController.FindUserByUsername(username);
    if (!user) {
        res.status(404).send({
            message: "thong tin dang nhap khong dung"
        })
        return;
    }
    if (!user.lockTime || user.lockTime < Date.now()) {
        if (bcrypt.compareSync(password, user.password)) {
            user.loginCount = 0;
            await user.save();
            let token = jwt.sign({
                id: user._id,
            }, privateKey, {
                algorithm: 'RS256',
                expiresIn: process.env.JWT_EXPIRES_IN || '1h'
            })
            res.send(token)
        } else {
            user.loginCount++;
            if (user.loginCount == 3) {
                user.loginCount = 0;
                user.lockTime = new Date(Date.now() + 60 * 60 * 1000)
            }
            await user.save();
            res.status(404).send({
                message: "thong tin dang nhap khong dung"
            })
        }
    } else {
        res.status(404).send({
            message: "user dang bi ban"
        })
    }

})

router.get('/me',checkLogin, function (req,res,next) {
    res.send(req.user)
})

router.post('/change-password', checkLogin, [
    body('oldPassword').notEmpty().withMessage('Vui lòng nhập mật khẩu cũ'),
    body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
], async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        let { oldPassword, newPassword } = req.body;
        let user = req.user; 

        // Kiểm tra mật khẩu cũ có khớp không
        let isMatch = bcrypt.compareSync(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).send({ message: "Mật khẩu cũ không chính xác" });
        }

        // Mã hóa và lưu mật khẩu mới
        user.password = bcrypt.hashSync(newPassword, 10);
        await user.save();

        res.send({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
        res.status(500).send({ message: "Lỗi server" });
    }
})

module.exports = router;