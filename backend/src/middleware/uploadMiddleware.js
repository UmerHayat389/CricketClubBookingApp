const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: 'src/uploads',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// ✅ Allow only images
const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png'];

  if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Only images allowed'));
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;