var express = require('express');
var router = express.Router();
let inventoryModel = require('../schemas/inventories');

router.get('/', async function (req, res, next) {
    try {
        let inventories = await inventoryModel.find().populate('product');
        res.send(inventories);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

router.get('/:id', async function (req, res, next) {
    try {
        let id = req.params.id;
        let inventory = await inventoryModel.findById(id).populate('product');
        if (inventory) {
            res.send(inventory);
        } else {
            res.status(404).send({ message: "Khong tim thay Inventory ID" });
        }
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

router.post('/add-stock', async function (req, res, next) {
    try {
        let { product, quantity } = req.body;
        if (!quantity || quantity <= 0) {
            return res.status(400).send({ message: "Quantity phai lon hon 0" });
        }

        let inventory = await inventoryModel.findOneAndUpdate(
            { product: product },
            { $inc: { stock: quantity } },
            { new: true, runValidators: true }
        );

        if (!inventory) {
            return res.status(404).send({ message: "Khong tim thay inventory cho product nay" });
        }
        res.send(inventory);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

router.post('/remove-stock', async function (req, res, next) {
    try {
        let { product, quantity } = req.body;
        if (!quantity || quantity <= 0) return res.status(400).send({ message: "Quantity > hon 0" });

        let inventory = await inventoryModel.findOne({ product: product });
        if (!inventory) return res.status(404).send({ message: "Khong tim thay inventory cho product nay " });
        if (inventory.stock < quantity) return res.status(400).send({ message: "Stock khong the giam them" });

        inventory.stock -= quantity;
        await inventory.save();
        res.send(inventory);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

router.post('/reservation', async function (req, res, next) {
    try {
        let { product, quantity } = req.body;
        if (!quantity || quantity <= 0) return res.status(400).send({ message: "Quantity > hon 0" });

        let inventory = await inventoryModel.findOne({ product: product });
        if (!inventory) return res.status(404).send({ message: "Khong tim thay inventory cho product nay" });
        if (inventory.stock < quantity) return res.status(400).send({ message: "Stock khong du" });

        inventory.stock -= quantity;
        inventory.reserved += quantity;
        await inventory.save();
        res.send(inventory);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

router.post('/sold', async function (req, res, next) {
    try {
        let { product, quantity } = req.body;
        if (!quantity || quantity <= 0) return res.status(400).send({ message: "Quantity > hon 0" });

        let inventory = await inventoryModel.findOne({ product: product });
        if (!inventory) return res.status(404).send({ message: "khong tim thay inventory cho product nay " });
        if (inventory.reserved < quantity) return res.status(400).send({ message: "stock khong du de ban" });

        inventory.reserved -= quantity;
        inventory.soldCount += quantity;
        await inventory.save();
        res.send(inventory);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

module.exports = router;
