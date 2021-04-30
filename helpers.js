const file_Filter = function(req, file, cb) {
    if (!file.originalname.match(/\.(xlsx)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only excel files are allowed!'), false);
    }
    cb(null, true);
};
exports.file_Filter = file_Filter;