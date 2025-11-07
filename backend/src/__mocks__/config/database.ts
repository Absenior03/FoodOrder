export const DatabaseConfig = {
  getRedisClient: jest.fn().mockReturnValue({
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1)
  })
};