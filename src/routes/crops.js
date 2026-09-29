const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createCrop,
  getCrops,
  getCropById,
  updateCrop,
  deleteCrop,
} = require('../controllers/cropController');

router.post('/', createCrop);
router.get('/', getCrops);
router.get('/:id', getCropById);
router.put('/:id', updateCrop);
router.delete('/:id', deleteCrop);

module.exports = router;
