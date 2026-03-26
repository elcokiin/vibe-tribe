const mockUseSession = jest.fn();
const mockSignInEmail = jest.fn();
const mockSignInSocial = jest.fn();
const mockSignUpEmail = jest.fn();
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
  signOut: mockSignOut,
  getCookie: mockGetCookie,
};

module.exports = {
  mockUseSession,
  mockSignInEmail,
  mockSignInSocial,
  mockSignUpEmail,
  mockSignOut,
  mockGetCookie,
  mockAuthClient,
};
