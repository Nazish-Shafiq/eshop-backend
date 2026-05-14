function errorHandler(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    // JWT authentication error
    return res.status(401).json({ message: "Invalid Token" });
  }
  // Default to 500 server error
  return res.status(500).json({ message: err.message });
}
module.exports = errorHandler;
