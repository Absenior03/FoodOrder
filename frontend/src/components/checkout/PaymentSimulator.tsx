import React, { useState } from 'react';

interface PaymentSimulatorProps {
  totalAmount: number;
  onPaymentMethodChange: (method: string) => void;
  selectedMethod?: string;
  isProcessing?: boolean;
}

const PaymentSimulator: React.FC<PaymentSimulatorProps> = ({
  totalAmount,
  onPaymentMethodChange,
  selectedMethod = 'credit_card',
  isProcessing = false
}) => {
  const [paymentMethod, setPaymentMethod] = useState(selectedMethod);

  const paymentMethods = [
    {
      id: 'credit_card',
      name: 'Credit Card',
      description: 'Visa, MasterCard, American Express',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      id: 'debit_card',
      name: 'Debit Card',
      description: 'Pay directly from your bank account',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 'digital_wallet',
      name: 'Digital Wallet',
      description: 'Apple Pay, Google Pay, PayPal',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'cash_on_delivery',
      name: 'Cash on Delivery',
      description: 'Pay when your order arrives',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ];

  const handleMethodChange = (methodId: string) => {
    setPaymentMethod(methodId);
    onPaymentMethodChange(methodId);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
      
      {/* Payment Amount Display */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium text-blue-900">Total Amount:</span>
          <span className="text-2xl font-bold text-blue-900">₹{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-3">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className={`relative border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              paymentMethod === method.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !isProcessing && handleMethodChange(method.id)}
          >
            <div className="flex items-center">
              <input
                type="radio"
                id={method.id}
                name="paymentMethod"
                value={method.id}
                checked={paymentMethod === method.id}
                onChange={() => handleMethodChange(method.id)}
                disabled={isProcessing}
                className="sr-only"
              />
              <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                paymentMethod === method.id
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {paymentMethod === method.id && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              
              <div className={`mr-3 ${
                paymentMethod === method.id ? 'text-blue-600' : 'text-gray-400'
              }`}>
                {method.icon}
              </div>
              
              <div className="flex-1">
                <h3 className={`font-medium ${
                  paymentMethod === method.id ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  {method.name}
                </h3>
                <p className={`text-sm ${
                  paymentMethod === method.id ? 'text-blue-700' : 'text-gray-500'
                }`}>
                  {method.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Security Notice */}
      <div className="mt-6 p-3 bg-green-50 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-green-800">Secure Payment</h4>
            <p className="text-sm text-green-700 mt-1">
              Your payment information is encrypted and secure. This is a demo environment - no real payments will be processed.
            </p>
          </div>
        </div>
      </div>

      {/* Demo Notice */}

    </div>
  );
};

export default PaymentSimulator;