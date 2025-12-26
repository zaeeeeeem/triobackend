"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customer_address_controller_1 = require("../controllers/customer-address.controller");
const customer_auth_1 = require("../middleware/customer-auth");
const address_validator_1 = require("../validators/address.validator");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(customer_auth_1.authenticateCustomer);
/**
 * @swagger
 * /customers/addresses:
 *   get:
 *     summary: List all addresses for the authenticated customer
 *     tags: [Customer Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Addresses retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', customer_address_controller_1.customerAddressController.listAddresses);
/**
 * @swagger
 * /customers/addresses:
 *   post:
 *     summary: Create a new address
 *     tags: [Customer Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - addressLine1
 *               - city
 *               - postalCode
 *               - country
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               company:
 *                 type: string
 *               addressLine1:
 *                 type: string
 *               addressLine2:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               country:
 *                 type: string
 *               phone:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *               isDefaultBilling:
 *                 type: boolean
 *               label:
 *                 type: string
 *                 enum: [home, work, other]
 *     responses:
 *       201:
 *         description: Address created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', address_validator_1.createAddressValidator, customer_address_controller_1.customerAddressController.createAddress);
/**
 * @swagger
 * /customers/addresses/{addressId}:
 *   get:
 *     summary: Get a specific address by ID
 *     tags: [Customer Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Address retrieved successfully
 *       404:
 *         description: Address not found
 */
router.get('/:addressId', address_validator_1.addressIdParamValidator, customer_address_controller_1.customerAddressController.getAddressById);
/**
 * @swagger
 * /customers/addresses/{addressId}:
 *   patch:
 *     summary: Update an existing address
 *     tags: [Customer Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               company:
 *                 type: string
 *               addressLine1:
 *                 type: string
 *               addressLine2:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               country:
 *                 type: string
 *               phone:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *               isDefaultBilling:
 *                 type: boolean
 *               label:
 *                 type: string
 *                 enum: [home, work, other]
 *     responses:
 *       200:
 *         description: Address updated successfully
 *       404:
 *         description: Address not found
 */
router.patch('/:addressId', address_validator_1.addressIdParamValidator, address_validator_1.updateAddressValidator, customer_address_controller_1.customerAddressController.updateAddress);
/**
 * @swagger
 * /customers/addresses/{addressId}:
 *   delete:
 *     summary: Delete an address
 *     tags: [Customer Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *       400:
 *         description: Cannot delete the only address
 *       404:
 *         description: Address not found
 */
router.delete('/:addressId', address_validator_1.addressIdParamValidator, customer_address_controller_1.customerAddressController.deleteAddress);
/**
 * @swagger
 * /customers/addresses/{addressId}/set-default:
 *   post:
 *     summary: Set an address as default (shipping or billing)
 *     tags: [Customer Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [shipping, billing]
 *                 default: shipping
 *     responses:
 *       200:
 *         description: Default address set successfully
 *       404:
 *         description: Address not found
 */
router.post('/:addressId/set-default', address_validator_1.addressIdParamValidator, address_validator_1.setDefaultAddressValidator, customer_address_controller_1.customerAddressController.setDefaultAddress);
exports.default = router;
//# sourceMappingURL=customer-address.routes.js.map