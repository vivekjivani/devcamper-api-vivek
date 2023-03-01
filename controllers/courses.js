const asyncMiddleware = require("../midlleware/async")
const Bootcamp = require("../models/Bootcamp")
const Course = require("../models/Course")
const ErrorResponse = require("../util/errorResponse.js")

// @desc     Get All Courses
// @route    GET /api/v1/courses
// @route    GET /api/v1/bootcamps/:bootcampId/courses
// @access   Public
exports.getCourses = asyncMiddleware(async (req, res, next) => {
  if (req.params.bootcampId) {
    const courses = await Course.find({ bootcamp: req.params.bootcampId })

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    })
  } else {
    res.status(200).json(res.advancedResults)
  }
})

// @desc     Get a Single Course
// @route    GET /api/v1/courses/:id
// @access   Public
exports.getCourse = asyncMiddleware(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate({
    path: "bootcamp",
    select: "name description",
  })

  if (!course) {
    return next(new ErrorResponse(`No Course with id of ${req.params.id}`, 404))
  }
  res.status(200).json({
    success: true,
    data: course,
  })
})

// @desc     Create Course
// @route    POST /api/v1/bootcamps/:bootcampId/courses
// @access   Private
exports.addCourse = asyncMiddleware(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId
  req.body.user = req.user.id

  const bootcamp = await Bootcamp.findById(req.params.bootcampId)

  if (!bootcamp) {
    return next(
      new ErrorResponse(`No Bootcamp with id of ${req.params.bootcampId}`, 404)
    )
  }

  // Make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to Add a Course to bootcamp ${bootcamp._id}`,
        401
      )
    )
  }

  const course = await Course.create(req.body)

  res.status(200).json({
    success: true,
    data: course,
  })
})

// @desc     Update Course
// @route    PUT /api/v1/courses/:id
// @access   Private
exports.updateCourse = asyncMiddleware(async (req, res, next) => {
  let course = await Course.findById(req.params.id)

  if (!course) {
    return next(new ErrorResponse(`No Course with id of ${req.params.id}`, 404))
  }

  // Make sure user is bootcamp owner
  if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this course ${course._id}`,
        401
      )
    )
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
  res.status(200).json({
    success: true,
    data: course,
  })
})

// @desc     Delete Course
// @route    DELETE /api/v1/courses/:id
// @access   Private
exports.deleteCourse = asyncMiddleware(async (req, res, next) => {
  const course = await Course.findById(req.params.id)

  if (!course) {
    return next(new ErrorResponse(`No Course with id of ${req.params.id}`, 404))
  }

  // Make sure user is bootcamp owner
  if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this course ${course._id}`,
        401
      )
    )
  }

  await course.remove()

  res.status(200).json({
    success: true,
    data: {},
  })
})
