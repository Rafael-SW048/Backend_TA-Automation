function createResponse(code, message, status = 'success', details = "") {
    let response = { 
        [status]: { 
            "code": code, 
            "message": message 
        }
    };
    if (details) {
        response[status]["details"] = details;
    }
    return response;
  }
  
  module.exports = createResponse;