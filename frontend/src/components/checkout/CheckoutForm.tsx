import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { orderService } from '../../services/orderService';
import { Address, CheckoutValidationResponse } from '../../types/order';
import OrderSummary from './OrderSummary';
import DeliveryAddressForm from './DeliveryAddressForm';
import PaymentSimulator from './PaymentSimulator';
import ErrorDisplay from '../common/ErrorDisplay';
import { InteractiveBackground } from '../common/InteractiveBackground';
import { MouseReactiveElement } from '../common/MouseReactiveElement';
import { MouseTrackingTilt } from '../common/MouseTrackingTilt';

const CheckoutForm: React.FC = () => {
  const navigate = useNavigate();
  const { state: cartState, getCartTotal, clearCart } = useCart();
  
  const [deliveryAddress, setDeliveryAddress] = useState<Address>({
    street: '',
    city: '',
    state: '',
    zipCode: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [validation, setValidation] = useState<CheckoutValidationResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<{
    address?: Partial<Address>;
    general?: string;
    validation?: string;
    network?: string;
  }>({});
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [lastFailedOperation, setLastFailedOperation] = useState<'validation' | 'checkout' | null>(null);

  // Validate checkout on component mount and when cart changes
  useEffect(() => {
    if (cartState.items.length > 0) {
      validateCheckout();
    }
  }, [cartState.items]);

  const validateCheckout = async () => {
    try {
      setIsValidating(true);
      setErrors({ ...errors, validation: undefined, network: undefined });
      const response = await orderService.validateCheckout();
      setValidation(response);
      setLastFailedOperation(null);
      setRetryAttempts(0);
    } catch (error: any) {
      console.error('Validation error:', error);
      setLastFailedOperation('validation');
      
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        setErrors({ 
          ...errors, 
          network: 'Network connection failed. Please check your internet connection and try again.' 
        });
      } else if (error.response?.status === 401) {
        setErrors({ 
          ...errors, 
          validation: 'Your session has expired. Please log in again.' 
        });
      } else if (error.response?.status >= 500) {
        setErrors({ 
          ...errors, 
          validation: 'Server error occurred. Please try again in a few moments.' 
        });
      } else {
        setErrors({ 
          ...errors, 
          validation: error.response?.data?.error?.message || 'Failed to validate cart items. Please try again.' 
        });
      }
    } finally {
      setIsValidating(false);
    }
  };

  const validateAddress = (address: Address): Partial<Address> => {
    const addressErrors: Partial<Address> = {};
    
    if (!address.street.trim()) {
      addressErrors.street = 'Street address is required';
    } else if (address.street.length > 200) {
      addressErrors.street = 'Street address cannot exceed 200 characters';
    }
    
    if (!address.city.trim()) {
      addressErrors.city = 'City is required';
    } else if (address.city.length > 100) {
      addressErrors.city = 'City cannot exceed 100 characters';
    }
    
    if (!address.state.trim()) {
      addressErrors.state = 'State is required';
    } else if (address.state.length > 50) {
      addressErrors.state = 'State cannot exceed 50 characters';
    }
    
    if (!address.zipCode.trim()) {
      addressErrors.zipCode = 'ZIP code is required';
    } else if (!/^\d{6}$/.test(address.zipCode)) {
      addressErrors.zipCode = 'Please enter a valid PIN code (6 digits)';
    }
    
    return addressErrors;
  };

  const handleAddressChange = (address: Address) => {
    setDeliveryAddress(address);
    // Clear address errors when user makes changes
    if (errors.address) {
      setErrors({ ...errors, address: {} });
    }
  };

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
  };

  const handleRetryValidation = async () => {
    setRetryAttempts(prev => prev + 1);
    await validateCheckout();
  };

  const handleRetryCheckout = async () => {
    setRetryAttempts(prev => prev + 1);
    const event = new Event('submit') as any;
    event.preventDefault = () => {};
    await handleSubmit(event);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate address
    const addressErrors = validateAddress(deliveryAddress);
    if (Object.keys(addressErrors).length > 0) {
      setErrors({ address: addressErrors });
      return;
    }

    // Check if cart is empty
    if (cartState.items.length === 0) {
      setErrors({ general: 'Your cart is empty. Please add items before checkout.' });
      return;
    }

    // Check validation results
    if (validation && !validation.data.validation.valid) {
      setErrors({ general: 'Some items in your cart are no longer available. Please review your order.' });
      return;
    }

    try {
      setIsProcessing(true);
      setErrors({});
      setLastFailedOperation(null);

      // Process checkout
      const checkoutResponse = await orderService.checkout({
        deliveryAddress
      });

      if (checkoutResponse.success) {
        // Clear cart after successful checkout
        await clearCart();
        
        // Navigate to order confirmation page
        navigate(`/order-confirmation/${checkoutResponse.data.order.orderId}`, {
          state: { order: checkoutResponse.data.order }
        });
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      setLastFailedOperation('checkout');
      
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        setErrors({ 
          network: 'Network connection failed during checkout. Your order was not processed. Please try again.' 
        });
      } else if (error.response?.status === 401) {
        setErrors({ 
          general: 'Your session has expired. Please log in again to complete your order.' 
        });
      } else if (error.response?.data?.error?.code === 'STOCK_VALIDATION_FAILED') {
        const stockErrors = error.response.data.error.details || [];
        const errorMessage = stockErrors.length > 0 
          ? `The following items are no longer available: ${stockErrors.map((item: any) => item.name).join(', ')}`
          : 'Some items in your cart are no longer available or have insufficient stock.';
        
        setErrors({ 
          general: `${errorMessage} Please review your order and try again.` 
        });
        // Refresh validation to show current stock status
        validateCheckout();
      } else if (error.response?.data?.error?.code === 'EMPTY_CART') {
        setErrors({ 
          general: 'Your cart is empty. Please add items before checkout.' 
        });
      } else if (error.response?.data?.error?.code === 'MISSING_DELIVERY_ADDRESS') {
        setErrors({ 
          general: 'Please provide a complete delivery address.' 
        });
      } else if (error.response?.data?.error?.code === 'INVALID_ZIP_CODE') {
        setErrors({ 
          address: { zipCode: 'Please enter a valid PIN code (6 digits)' }
        });
      } else if (error.response?.status >= 500) {
        setErrors({ 
          general: 'Server error occurred during checkout. Please try again in a few moments.' 
        });
      } else {
        setErrors({ 
          general: error.response?.data?.error?.message || 'Checkout failed. Please try again.' 
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Redirect if cart is empty
  if (cartState.items.length === 0 && !isValidating) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Checkout</h1>
          <div className="bg-white rounded-lg shadow-md p-8">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 1.5M7 13l1.5 1.5M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some delicious items to your cart before checkout.</p>
            <button
              onClick={() => navigate('/menu')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const total = getCartTotal();
  const totalWithTax = total * 1.08; // 8% tax

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Interactive Background */}
      <InteractiveBackground 
        particleCount={20}
        mouseInfluence={40}
        colors={['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981']}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MouseTrackingTilt tiltStrength={4} trackingRadius={200} className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Checkout
          </h1>
          <p className="text-gray-600 mt-2">Complete your order and get your food delivered</p>
        </MouseTrackingTilt>
      
      {/* Loading state */}
      {isValidating && (
        <MouseReactiveElement
          intensity={1}
          magneticRadius={150}
          tiltStrength={8}
          glowIntensity={0.3}
          className="text-center py-8"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-white/20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-700 font-medium">Validating your order...</p>
          </div>
        </MouseReactiveElement>
      )}

      {/* Error messages */}
      {errors.network && (
        <MouseReactiveElement
          intensity={0.8}
          magneticRadius={150}
          tiltStrength={6}
          glowIntensity={0.2}
          className="mb-6"
        >
          <ErrorDisplay
            error={errors.network}
            type="error"
            title="Connection Error"
            showRetry={true}
            onRetry={lastFailedOperation === 'validation' ? handleRetryValidation : handleRetryCheckout}
          />
        </MouseReactiveElement>
      )}

      {errors.validation && (
        <MouseReactiveElement
          intensity={0.8}
          magneticRadius={150}
          tiltStrength={6}
          glowIntensity={0.2}
          className="mb-6"
        >
          <ErrorDisplay
            error={errors.validation}
            type="warning"
            title="Validation Error"
            showRetry={true}
            onRetry={handleRetryValidation}
          />
        </MouseReactiveElement>
      )}

      {errors.general && !errors.network && !errors.validation && (
        <MouseReactiveElement
          intensity={0.8}
          magneticRadius={150}
          tiltStrength={6}
          glowIntensity={0.2}
          className="mb-6"
        >
          <ErrorDisplay
            error={errors.general}
            type="error"
            title="Checkout Error"
            showRetry={lastFailedOperation === 'checkout'}
            onRetry={lastFailedOperation === 'checkout' ? handleRetryCheckout : undefined}
          />
        </MouseReactiveElement>
      )}

      {!isValidating && (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Forms */}
            <div className="space-y-6">
              {/* Delivery Address Form */}
              <MouseReactiveElement
                intensity={0.8}
                magneticRadius={150}
                tiltStrength={6}
                glowIntensity={0.2}
              >
                <DeliveryAddressForm
                  onAddressChange={handleAddressChange}
                  initialAddress={deliveryAddress}
                  errors={errors.address}
                />
              </MouseReactiveElement>

              {/* Payment Method */}
              <MouseReactiveElement
                intensity={0.8}
                magneticRadius={150}
                tiltStrength={6}
                glowIntensity={0.2}
              >
                <PaymentSimulator
                  totalAmount={totalWithTax}
                  onPaymentMethodChange={handlePaymentMethodChange}
                  selectedMethod={paymentMethod}
                  isProcessing={isProcessing}
                />
              </MouseReactiveElement>
            </div>

            {/* Right Column - Order Summary */}
            <div className="space-y-6">
              <MouseReactiveElement
                intensity={0.8}
                magneticRadius={150}
                tiltStrength={6}
                glowIntensity={0.2}
              >
                <OrderSummary
                  validationItems={validation?.data.validation.items}
                  showValidation={!!validation}
                />
              </MouseReactiveElement>

              {/* Place Order Button */}
              <MouseReactiveElement
                intensity={1.2}
                magneticRadius={200}
                tiltStrength={8}
                glowIntensity={0.3}
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
                <button
                  type="submit"
                  disabled={Boolean(isProcessing || isValidating || (validation && validation.data?.validation?.valid === false))}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    isProcessing || isValidating || (validation && validation.data?.validation?.valid === false)
                      ? 'bg-gray-400 cursor-not-allowed transform-none hover:scale-100'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                  }`}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing Order...
                    </div>
                  ) : (
                    `Place Order - ₹${totalWithTax.toFixed(2)}`
                  )}
                </button>

                {validation && !validation.data.validation.valid && (
                  <p className="mt-2 text-sm text-red-600 text-center">
                    Please resolve the issues above before placing your order.
                  </p>
                )}
                </div>
              </MouseReactiveElement>
            </div>
          </div>
        </form>
      )}
      </div>
    </div>
  );
};

export default CheckoutForm;