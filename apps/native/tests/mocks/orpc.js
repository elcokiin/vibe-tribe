const mockRefetchQueries = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockHealthCheckQueryOptions = jest.fn(() => ({
  queryKey: ["healthCheck"],
  queryFn: async () => "OK",
}));
const mockProfileGetMineQueryOptions = jest.fn(() => ({
  queryKey: ["profile", "getMine"],
  queryFn: async () => ({
    userId: "1",
    name: "Test User",
    email: "test@mail.com",
    avatarUrl: null,
    description: "",
    favoriteDestinations: [],
    updatedAt: new Date(),
  }),
}));
const mockProfileGetMineQueryKey = jest.fn(() => ["profile", "getMine"]);
const mockProfileUpdateMineMutationFn = jest.fn(async (input) => ({
  userId: "1",
  name: "Test User",
  email: "test@mail.com",
  avatarUrl: input?.avatarUrl ?? null,
  description: input?.description ?? "",
  favoriteDestinations: input?.favoriteDestinations ?? [],
  updatedAt: new Date(),
}));
const mockProfileUpdateMineMutationOptions = jest.fn((options = {}) => ({
  mutationKey: ["profile", "updateMine"],
  mutationFn: mockProfileUpdateMineMutationFn,
  ...options,
}));

const queryClient = {
  refetchQueries: mockRefetchQueries,
  invalidateQueries: mockInvalidateQueries,
};

const orpc = {
  healthCheck: {
    queryOptions: mockHealthCheckQueryOptions,
  },
  profile: {
    getMine: {
      queryOptions: mockProfileGetMineQueryOptions,
      queryKey: mockProfileGetMineQueryKey,
    },
    updateMine: {
      mutationOptions: mockProfileUpdateMineMutationOptions,
    },
  },
};

module.exports = {
  queryClient,
  orpc,
  mockRefetchQueries,
  mockInvalidateQueries,
  mockHealthCheckQueryOptions,
  mockProfileGetMineQueryOptions,
  mockProfileGetMineQueryKey,
  mockProfileUpdateMineMutationFn,
  mockProfileUpdateMineMutationOptions,
};
