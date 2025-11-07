export const User = jest.fn().mockImplementation(() => ({
  save: jest.fn().mockResolvedValue(true),
  _id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe'
}));

// Add static methods to the mock constructor
(User as any).findOne = jest.fn();
(User as any).findById = jest.fn();