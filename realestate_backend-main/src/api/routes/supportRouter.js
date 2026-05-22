const router = require("express").Router();
const supportCtrl = require("../controllers/supportController");
const { auth } = require("../middleware/auth");
const { uploadSupportAttachments } = require("../utils/multer");

// Send a message (User)
router.post(
    "/",
    auth,
    uploadSupportAttachments,
    supportCtrl.createSupportMessage
);

// Get all messages (Supervisor)
// Ideally we should have admin middleware here, but for now we'll just use auth
router.get("/", auth, supportCtrl.getSupportMessages);

// Get single message
router.get("/:id", auth, supportCtrl.getSupportMessageById);

module.exports = router;
