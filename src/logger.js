// logger.js
class Logger {
    static log(...messages) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(...messages);
      }
    }
  
    static error(...messages) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(...messages);
      } else {
        // Here, you can send error reports to a logging service in production
        // sendErrorReport(...messages);
      }
    }
  
    static warn(...messages) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(...messages);
      }
    }
  
    // ... any other console methods you want to override
  }
  
  export default Logger;
  