import React, { useState } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { useNavigate} from "react-router-dom";
import "react-phone-number-input/style.css";
import PhoneInput from "react-phone-number-input";
import "bootstrap/dist/css/bootstrap.min.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import logo from "../Logo/szechuan_chicken.png";
import text_logo from "../Logo/szechuan_text_logo.png";
import { useUserAuth } from "../UserContextProvider";
// import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function SignUp() {
  const [phone, setPhone] = useState("");
  const [isValidNumber, setIsValidNumber] = useState(true);
  const [codeSent, setCodeSent] = useState(false);
  const [confirmOTP, setConfirmOTP] = useState("")
  const [verificationCode, setVerificationCode] = useState("");
  const {recaptchaVerify} = useUserAuth();
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendVerificationCode = async () => {
    setError("");
    if (phone && parsePhoneNumberFromString(phone)) {
      setCodeSent(true);
    } else {
      setIsValidNumber(false);
    }
    if(phone === "" || phone === undefined)
    return setError("Please enter a Valid Phone Number!")
    try {
      const response = await recaptchaVerify(phone);
      console.log(response);
      setConfirmOTP(response);
      setIsVerified(true);
      
    } catch (err) {
      setError(err.message)
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();

    console.log(verificationCode);
    if(verificationCode === "" || verificationCode === null) return;
    try{
      setError("");
      setIsLoading(true);
      await confirmOTP.confirm(verificationCode);

      setTimeout(() => {
        setIsLoading(false); // Set isLoading to false
        navigate("/dashboard");
      }, 2000);
    }
    catch (err){
      setIsLoading(false);
      setError(err.message);
    }
  };

  return (
    <Container
      className="d-flex align-items-center justify-content-center vh-100"
      style={{ backgroundColor: "#f8f9fa" }}
    >
      <Row>
        <Col xs={15} md={12} className="mx-auto">
          <div className="text-center mb-4">
            <img
              src={logo}
              alt="Logo"
              style={{ width: "150px", height: "150px" }}
            />
            <img
              src={text_logo}
              alt="Text Logo"
              style={{ width: "150px", height: "150px" }}
            />
          </div>
          <h2
            className="text-center mb-4"
            style={{ color: "#343a40", fontWeight: "bold" }}
          >
            Sign in
          </h2>
          <Form>
            <Form.Group className="mb-3">
              <PhoneInput
                international
                defaultCountry="US"
                value={phone}
                onChange={(value) => {
                  setPhone(value);
                  setIsValidNumber(
                    !!(value && parsePhoneNumberFromString(value))
                  );
                }}
                placeholder="Enter phone number"
                displayInitialValueAsLocalNumber={true}
                error={isValidNumber ? undefined : "Invalid phone number"}
              />
              <div
                className="text-muted mt-2"
                style={{ fontSize: "0.675rem", opacity: 0.6, fontStyle: "italic" }}
              >
                We will send you a verification code
              </div>
              {!isVerified && (
                <div id="recaptcha-container"/>
              )}
              {!isValidNumber && (
                <div className="text-danger" style={{ fontSize: "0.875rem" }}>
                  Invalid phone number
                </div>
              )}
            </Form.Group>
            {codeSent ? (
              <div>
                <Form.Group className="mb-3">
                  <Form.Control
                    type="text"
                    placeholder="Enter verification code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                  />
                </Form.Group>
                <Button
                variant="primary"
                className="w-100"
                onClick={verifyOtp}
                style={{
                  backgroundColor: "#007bff",
                  position: "relative", // Add position relative for the parent container
                }}
              >
                Verify Code
                {isLoading && ( // Display loading overlay if isLoading is true
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      backgroundColor: "rgba(255, 255, 255, 0.8)", // Semi-transparent white background
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                )}
              </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                className="w-100 mt-3"
                onClick={handleSendVerificationCode}
                style={{ backgroundColor: "#007bff" }}
              >
                Send Code
              </Button>
            )}
            {error && <div className="text-danger mt-2">{error}</div>}
          </Form>
        </Col>
      </Row>
    </Container>
  );
}

export default SignUp;
