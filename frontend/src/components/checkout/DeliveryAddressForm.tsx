import React, { useState } from 'react';
import { Address } from '../../types/order';

interface DeliveryAddressFormProps {
  onAddressChange: (address: Address) => void;
  initialAddress?: Address;
  errors?: Partial<Address>;
}

const DeliveryAddressForm: React.FC<DeliveryAddressFormProps> = ({
  onAddressChange,
  initialAddress,
  errors = {}
}) => {
  const [address, setAddress] = useState<Address>(
    initialAddress || {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    }
  );

  const handleInputChange = (field: keyof Address, value: string) => {
    const updatedAddress = { ...address, [field]: value };
    setAddress(updatedAddress);
    onAddressChange(updatedAddress);
  };

  const validateZipCode = (zipCode: string): boolean => {
    // Indian PIN code validation (6 digits)
    const zipRegex = /^\d{6}$/;
    return zipRegex.test(zipCode);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Address</h2>
      
      <div className="space-y-4">
        {/* Street Address */}
        <div>
          <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
            Street Address *
          </label>
          <input
            type="text"
            id="street"
            value={address.street}
            onChange={(e) => handleInputChange('street', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.street ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="123 Main Street, Apt 4B"
            maxLength={200}
          />
          {errors.street && (
            <p className="mt-1 text-sm text-red-600">{errors.street}</p>
          )}
        </div>

        {/* City and State */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              type="text"
              id="city"
              value={address.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.city ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="New York"
              maxLength={100}
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city}</p>
            )}
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
              State *
            </label>
            <input
              type="text"
              id="state"
              value={address.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.state ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="NY"
              maxLength={50}
            />
            {errors.state && (
              <p className="mt-1 text-sm text-red-600">{errors.state}</p>
            )}
          </div>
        </div>

        {/* ZIP Code */}
        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
            PIN Code *
          </label>
          <input
            type="text"
            id="zipCode"
            value={address.zipCode}
            onChange={(e) => handleInputChange('zipCode', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.zipCode ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="123456"
            maxLength={6}
          />
          {errors.zipCode && (
            <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>
          )}

        </div>
      </div>

      {/* Address Preview */}
      {address.street && address.city && address.state && address.zipCode && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200/50">
          <h3 className="text-sm font-medium text-gray-700 mb-2">📍 Delivery Address Preview:</h3>
          <div className="text-sm text-gray-600">
            <p className="font-medium">{address.street}</p>
            <p>{address.city}, {address.state} {address.zipCode}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryAddressForm;