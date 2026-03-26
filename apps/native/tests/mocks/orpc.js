const mockRefetchQueries = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockHealthCheckQueryOptions = jest.fn(() => ({
  queryKey: ["healthCheck"],
  queryFn: async () => "OK",
}));

const queryClient = {
  refetchQueries: mockRefetchQueries,
  invalidateQueries: mockInvalidateQueries,
};

const orpc = {
  healthCheck: {
    queryOptions: mockHealthCheckQueryOptions,
  },
};

module.exports = {
  queryClient,
  orpc,
  mockRefetchQueries,
  mockInvalidateQueries,
  mockHealthCheckQueryOptions,
};
