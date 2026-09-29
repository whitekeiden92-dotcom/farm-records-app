const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createLivestock,
  getLivestock,
  getLivestockById,
  updateLivestock,
  deleteLivestock,
} = require('../controllers/livestockController');

router.post('/', createLivestock);
router.get('/', getLivestock);
router.get('/:id', getLivestockById);
router.put('/:id', updateLivestock);
router.delete('/:id', deleteLivestock);

module.exports = router;
