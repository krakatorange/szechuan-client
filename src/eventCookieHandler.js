// cookieHelpers.js

/**
 * Sets a cookie.
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Duration for the cookie in days
 */
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
  }
  
  /**
   * Returns a cookie value by name.
   * @param {string} name - Cookie name
   * @returns {string|null} - Cookie value or null if not found
   */
  function getCookie(name) {
    const value = "; " + document.cookie;
    const parts = value.split("; " + name + "=");
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  }
  
  /**
   * Saves the event URL in a cookie.
   * @param {string} url - Event URL
   */
  export function saveEventUrlInCookie(url) {
    setCookie("eventUrl", url, 1);
  }
  
  /**
   * Retrieves the event URL from the cookie.
   * @returns {string|null} - Event URL or null if not found
   */
  export function getEventUrlFromCookie() {
    return getCookie("eventUrl");
  }
  