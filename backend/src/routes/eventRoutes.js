const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();

const {
  createEvent, getEvents, updateEvent,
  deleteEvent, toggleFree,
} = require('../controllers/eventController');

// ── Ensure upload directory exists ────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../uploads/events');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Multer config ─────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase())
             && allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Only image files are allowed'));
  },
});

router.get('/',                       getEvents);
router.post('/',  upload.single('banner'), createEvent);
router.put('/:id', upload.single('banner'), updateEvent);
router.delete('/:id',                 deleteEvent);
router.patch('/:id/toggle-free',      toggleFree);

module.exports = router;