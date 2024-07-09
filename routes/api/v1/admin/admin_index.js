const router = require("express").Router();
const multer = require("multer");
const { profileUpload } = require("../../../../utils/s3Utils");

/*-----------------------------------
  ADMIN TOP TIER FOLDER
-----------------------------------*/

const leaves = require("./leaves/leaves_index");

/*-----------------------------------
  INDEXES
-----------------------------------*/
const employees = require("./employees/employees_index");
const retired_employees = require("./retired_employees/retired_employees_index");
const employment_contracts = require("./employment_contracts/employment_contracts_index");
const holidays = require("./holidays/holidays_index");
const dashboard = require("./dashboard/dashboard_index");

/*-----------------------------------
  Controller
-----------------------------------*/
const adProfileCtrl = require("./adProfile/adProfile_controller");

/*-----------------------------------
  API
-----------------------------------*/
router.use("/leaves", leaves);
router.use("/employees", employees);
router.use("/retired_employees", retired_employees);
router.use("/employment_contracts", employment_contracts);
router.use("/holidays", holidays);
router.use("/dashboard", dashboard);

/* Profile Image Update */
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, "uploads/profile_img/temp");
    },
    filename(req, file, cb) {
        // fileName = encodeURI(file.originalname);
        cb(null, `${Date.now()}_${file.originalname}`);

        // cb(null, `${file.originalname}`);
    },
});
const upload = multer({ storage });
/* Profile */
router.get("/profile", adProfileCtrl.profile);
router.patch("/profileChange", adProfileCtrl.profileChange);
router.post("/profileImageChange", profileUpload.single("file"), adProfileCtrl.profileImageChange);

module.exports = router;
