import { Router } from 'express';
import { customerAddressController } from '../controllers/customer-address.controller';
import { authenticateCustomer } from '../middleware/customer-auth';
import {
  createAddressValidator,
  updateAddressValidator,
  setDefaultAddressValidator,
  addressIdParamValidator,
} from '../validators/address.validator';

const router = Router();

// All routes require authentication
router.use(authenticateCustomer);

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
router.get('/', customerAddressController.listAddresses);

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
router.post('/', createAddressValidator, customerAddressController.createAddress);

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
router.get('/:addressId', addressIdParamValidator, customerAddressController.getAddressById);

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
router.patch(
  '/:addressId',
  addressIdParamValidator,
  updateAddressValidator,
  customerAddressController.updateAddress
);

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
router.delete('/:addressId', addressIdParamValidator, customerAddressController.deleteAddress);

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
router.post(
  '/:addressId/set-default',
  addressIdParamValidator,
  setDefaultAddressValidator,
  customerAddressController.setDefaultAddress
);

export default router;
