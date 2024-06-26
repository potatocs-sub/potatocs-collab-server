var fs = require("fs");
var path = require('path');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const sharp = require('sharp');
// const s3 = global.AWS_S3.s3;
// const bucket = global.AWS_S3.bucket

exports.profile = async (req, res) => {
  console.log(`
--------------------------------------------------
    NsAdmin Profile: ${req.decoded._id}
    router.get('/profile', nsProfileCtrl.profile) 
--------------------------------------------------`);

  const dbModels = global.DB_MODELS;

  const criteria = { _id: req.decoded._id };
  const projection = {
    password: false,
    createdAt: false,
    updatedAt: false
  }

  try {
    const nsAdmin = await dbModels.NsAdmin.findOne(criteria, projection);

    // console.log(nsAdmin);

    if (!nsAdmin) {
      return res.status(401).send({
        message: 'An error has occurred'
      });
    }

    return res.send({
      user: nsAdmin
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send('db Error');
  }
};

exports.profileChange = async (req, res) => {
  console.log(`
--------------------------------------------------
    NsAdmin Profile: ${req.decoded._id}
    router.get('/profileChange', nsProfileCtrl.profileChange) 
--------------------------------------------------`);
  const dbModels = global.DB_MODELS;
  const data = req.body;
  let updateData;

  try {
    const hasPwd = data.new_password;
    if (hasPwd == null || hasPwd == '') {
      updateData = {
        name: data.name,
        email: data.email,
      }
    } else {
      updateData = {
        name: data.name,
        password: data.new_password,
        email: data.email,
      }
    }

    const profileChange = await dbModels.NsAdmin.findOneAndUpdate(
      {
        _id: data._id
      },
      updateData,
      {
        fields: { password: 0 },
        new: true
      }
    )

    return res.send({
      message: 'changed',
      profileChange
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send('db Error');
  }
};

exports.profileImageChange = async (req, res) => {
  console.log(`
--------------------------------------------------
    NsAdmin Profile: ${req.decoded._id}
    router.post('/profileImageChange', nsProfileCtrl.profileImageChange)
--------------------------------------------------`);
  const dbModels = global.DB_MODELS;
  const data = req.files[0];

  try {
    const previousProfileImage = await dbModels.NsAdmin.findOne(
      {
        _id: req.decoded._id
      }
    )
    const resizePath = 'uploads/profile_img/' + data.filename;

    // 이미지 리사이즈 작업 -> 원본을 리사이즈한 뒤에 원본을 제거
    await sharp(data.path).resize(300, 300).toFile(resizePath);
    await unlinkAsync(data.path);
    // console.log(previousProfileImage)

    const resizeImgName = `profile-img/${Date.now()}.${data.originalname}`
    var params = {
      'Bucket': bucket,
      'Key': resizeImgName,
      'ACL': 'public-read',
      'Body': fs.createReadStream('./uploads/profile_img/' + data.filename),
      'ContentType': 'image/png'
    }

    // https://www.w3schools.com/jsref/jsref_decodeuri.asp
    // s3로부터 받은 Location이 깨졌을 경우 해결
    await s3.upload(params, async function (err, data) {
      // console.log(data);
      const changeProfileImage = await dbModels.NsAdmin.findOneAndUpdate(
        {
          _id: req.decoded._id
        },
        {
          profile_img_key: data.key,
          profile_img: decodeURI(data.Location)
        },
        {
          fields: { password: 0 },
          new: true
        }
      )
      // 로컬에 저장된 리사이즈 파일 제거
      await unlinkAsync(resizePath);
      // S3에 저장된 프로필 수정 전 리사이즈 파일 삭제
      if (previousProfileImage.profile_img_key != '') {
        const params = {
          Bucket: bucket,
          Key: previousProfileImage.profile_img_key
        };
        s3.deleteObject(params, function (err, data) {
          if (err) console.log(err, err.stack);
          else console.log('previous S3 pofile image delete Success');
        })
      }
      return res.send({
        message: 'profile image change',
        user: changeProfileImage
      });
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send('db Error');
  }
};