const asyncMiddleware = require("../midlleware/async")
const Bootcamp = require("../models/Bootcamp")
const ErrorResponse = require("../util/errorResponse.js")
const geoCoder = require("../util/geoCoder")
const path = require("path")

// @desc     Get All Bootcamps
// @route    GET /api/v1/bootcamps
// @access   Public
exports.getBootcamps = asyncMiddleware(async (req, res, next) => {
  res.status(200).json(res.advancedResults)
})

// @desc     Get Single Bootcamps
// @route    GET /api/v1/bootcamps/:id
// @access   Public
exports.getBootcamp = asyncMiddleware(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id)
  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp Not Found with id ${req.params.id}`, 400)
    )
  }

  res.status(200).json({
    success: true,
    data: bootcamp,
  })
})

// @desc     Create Bootcamps
// @route    POST /api/v1/bootcamps/:id
// @access   Private
exports.createBootcamp = asyncMiddleware(async (req, res, next) => {
  // Add User to Body
  req.body.user = req.user.id

  // Check for Published Bootcamp
  const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id })

  // if user is not an admin, they can create only one bootcamp
  if (publishedBootcamp && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User with ${req.user.id} has already published a bootcamp`,
        400
      )
    )
  }
  const bootcamp = await Bootcamp.create(req.body)

  res.status(201).json({
    success: true,
    data: bootcamp,
  })
})

// @desc     Update Bootcamps
// @route    PUT /api/v1/bootcamps/:id
// @access   Private
exports.updateBootcamp = asyncMiddleware(async (req, res, next) => {
  let bootcamp = await Bootcamp.findById(req.params.id)

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp Not Found with id ${req.params.id}`, 400)
    )
  }

  // Make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to update this bootcamp`,
        401
      )
    )
  }

  bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    success: true,
    data: bootcamp,
  })
})

// @desc     Delete Bootcamps
// @route    DELETE /api/v1/bootcamps/:id
// @access   Private
exports.deleteBootcamp = asyncMiddleware(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id)

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp Not Found with id ${req.params.id}`, 400)
    )
  }

  // Make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to delete this bootcamp`,
        401
      )
    )
  }

  bootcamp.remove()

  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc     Get Bootcamps within a radius
// @route    GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access   Private
exports.getBootcampsInRadius = asyncMiddleware(async (req, res, next) => {
  const { zipcode, distance } = req.params

  // Get lat/lag from geocoder
  const loc = await geoCoder.geocode(zipcode)
  const lat = loc[0].latitude
  const lng = loc[0].longitude

  // Calculate Radius using radians
  // Divide distance by radius of earth
  // Earth radius is 3,963 mi
  const EARTH_RADIUS = 3963
  const radius = distance / EARTH_RADIUS

  const bootcamps = await Bootcamp.find({
    location: {
      $geoWithin: { $centerSphere: [[lng, lat], radius] },
    },
  })

  res.status(200).json({
    success: true,
    count: bootcamps.length,
    data: bootcamps,
  })
})

// @desc     Upload photo for Bootcamps
// @route    PUT /api/v1/bootcamps/:id/photo
// @access   Private
exports.bootcampPhotoUpload = asyncMiddleware(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id)

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp Not Found with id ${req.params.id}`, 400)
    )
  }

  // Make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to Update this bootcamp`,
        401
      )
    )
  }

  if (!req.files) {
    return next(new ErrorResponse("Please Upload File", 400))
  }
  const file = req.files.file

  // Make sure file is a photo
  if (!file.mimetype.startsWith("image")) {
    return next(new ErrorResponse("Please Upload an Image File", 400))
  }

  // Check File Size
  if (file.size > process.env.MAX_FILE_SIZE) {
    return next(
      new ErrorResponse(
        `Please Upload an Image less then ${process.env.MAX_FILE_SIZE}`,
        400
      )
    )
  }

  // Create Custom File Name
  file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.error(err)
      return next(new ErrorResponse(`Problem with file upload`, 500))
    }

    await Bootcamp.findByIdAndUpdate(req.params.id, {
      photo: file.name,
    })
    res.status(200).json({
      success: true,
      data: file.name,
    })
  })
})
