const mockUseSession = jest.fn();
const mockSignInEmail = jest.fn();
const mockSignUpEmail = jest.fn();
const mockSignOut = jest.fn();
const mockGetCookie = jest.fn();

const mockAuthClient = {
  useSession: mockUseSession,
  signIn: {
    email: mockSignInEmail,
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
  mockSignUpEmail,
  mockSignOut,
  mockGetCookie,
  mockAuthClient,
};
