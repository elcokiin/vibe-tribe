const mockUseSession = jest.fn();
const mockSignInEmail = jest.fn();
const mockSignInSocial = jest.fn();
const mockSignUpEmail = jest.fn();
const mockEmailOtpVerifyEmail = jest.fn();
const mockEmailOtpSendVerificationOtp = jest.fn();
const mockSignOut = jest.fn();
const mockGetCookie = jest.fn();

const mockAuthClient = {
  useSession: mockUseSession,
  signIn: {
    email: mockSignInEmail,
    social: mockSignInSocial,
  },
  signUp: {
    email: mockSignUpEmail,
  },
  emailOtp: {
    verifyEmail: mockEmailOtpVerifyEmail,
    sendVerificationOtp: mockEmailOtpSendVerificationOtp,
  },
  signOut: mockSignOut,
  getCookie: mockGetCookie,
};

module.exports = {
  mockUseSession,
  mockSignInEmail,
  mockSignInSocial,
  mockSignUpEmail,
  mockEmailOtpVerifyEmail,
  mockEmailOtpSendVerificationOtp,
  mockSignOut,
  mockGetCookie,
  mockAuthClient,
};
