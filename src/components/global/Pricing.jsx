'use client';
import React, { useState, useEffect } from 'react';
import '@styles/ai/pricing/Pricing.css';
import { getDatabase, ref, set, get, onValue } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/router';

const Pricing = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [razorpayScriptLoaded, setRazorpayScriptLoaded] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentSubscriptionId, setCurrentSubscriptionId] = useState(null);
  const [showCancellationSurvey, setShowCancellationSurvey] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  // Custom popup state
  const [popup, setPopup] = useState({
    show: false,
    title: '',
    message: '',
    type: 'success', // success, error, warning, info
  });

  const user = getAuth().currentUser;

  // Helper function to show custom popup
  const showPopup = (title, message, type = 'success') => {
    setPopup({
      show: true,
      title,
      message,
      type,
    });
    
    // Auto-hide popup after 5 seconds
    setTimeout(() => {
      setPopup(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  useEffect(() => {
    const fetchSubscriptionId = async () => {
      try {
        const user = getAuth().currentUser;
        if (!user) return;
        
        const db = getDatabase();
        const subscriptionsRef = ref(db, `subscriptions/${user.uid}`);
        
        const snapshot = await get(subscriptionsRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setCurrentSubscriptionId(data.subscriptionId);
        }
      } catch (error) {
        console.error("Error fetching subscription ID:", error);
      }
    };

    const getSubscription = async () => {
      await fetchSubscriptionId();
    };
  
    getSubscription();
  }, []);
  
  useEffect(() => {
    const fetchCurrentPlan = async () => {
      try {
        const user = getAuth().currentUser;
        if (!user) {
          console.warn("User not logged in");
          setLoading(false);
          return;
        }
    
        const db = getDatabase();
        const subscriptionsRef = ref(db, `subscriptions/${user.uid}`);
    
        const snapshot = await get(subscriptionsRef);
        if (!snapshot.exists()) {
          setCurrentPlan(null);
          setLoading(false);
          return;
        }
    
        const userSubscription = snapshot.val();
        setCurrentPlan(userSubscription.planType);
        setCurrentSubscriptionId(userSubscription.subscriptionId); // Store the subscription ID for cancellation
        setLoading(false);
      } catch (error) {
        console.error("Error fetching subscription:", error);
        setLoading(false);
      }
    };
    
    fetchCurrentPlan();
  }, []);
  
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve, reject) => {
        if (window.Razorpay) {
          setRazorpayScriptLoaded(true);
          resolve(true);
        } else {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => {
            setRazorpayScriptLoaded(true);
            resolve(true);
          };
          script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
          document.body.appendChild(script);
        }
      });
    };
    loadRazorpayScript().catch((error) => console.error('Error loading Razorpay script:', error));
  }, []);
  
  // Handle Subscription Payment
  const handleSubscription = async (planType, amountUSD) => {
    try {
      const user = getAuth().currentUser;
      if (!user) {
        showPopup('Authentication Required', 'Please log in to subscribe', 'error');
        return;
      }
      // Create subscription
      const subscriptionResponse = await fetch('https://prfecai-backend-592134571427.us-central1.run.app/api/createSubscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType,
          customerEmail: user.email,
          customerId: user.uid
        }),
      });
      
      const subscriptionData = await subscriptionResponse.json();
      if (!subscriptionData.success) {
        throw new Error(subscriptionData.message || 'Failed to create subscription');
      }
      // Initialize Razorpay checkout
      if (razorpayScriptLoaded) {
        const options = {
          key: subscriptionData.key_id,
          subscription_id: subscriptionData.subscription.id,
          name: 'PrfeciAI',
          description: `${planType} Plan Subscription`,
          handler: async function(response) {
            try {
              // Verify the payment
              const verificationResponse = await fetch('https://prfecai-backend-592134571427.us-central1.run.app/api/verifySubscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_subscription_id: response.razorpay_subscription_id,
                  razorpay_signature: response.razorpay_signature
                }),
              });
              if (!verificationResponse.ok) {
                throw new Error(`Verification failed with status: ${verificationResponse.status}`);
              }
              const verificationData = await verificationResponse.json();
              if (verificationData.success) {
                // Store subscription data in Firebase
                await storeSubscriptionDataInFirebase({
                  subscriptionId: response.razorpay_subscription_id,
                  paymentId: response.razorpay_payment_id,
                  planType,
                  userId: user.uid,
                  email: user.email,
                  status: 'active',
                  startDate: new Date().toISOString(),
                  amount: amountUSD.toFixed(2)
                });
                // Store payment data in Firebase
                await storePaymentDataInFirebase({
                  amount: amountUSD.toFixed(2),
                  description: `${planType} plan subscription`,
                  email: user.email,
                  paymentStatus: 'success',
                  phone: user.phoneNumber || '',
                  planType,
                  subscriptionId: response.razorpay_subscription_id
                });
                setCurrentPlan(planType);
                setCurrentSubscriptionId(response.razorpay_subscription_id);

                showPopup('Success', 'Subscription activated successfully!', 'success');
              }               
              else {
                throw new Error(verificationData.message || 'Payment verification failed');
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              showPopup('Payment Verification Failed', error.message, 'error');
            }
          },
          prefill: {
            email: user.email,
            contact: user.phoneNumber || ''
          },
          theme: {
            color: '#2300A3'
          },
          method: {
            card: true,
            netbanking: true,
            wallet: true,
            upi: false // Disable UPI
          },
          modal: {
            ondismiss: function() {
              console.log('Checkout form closed');
            }
          }
        };
        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.on('payment.failed', function(response) {
          console.error('Payment failed:', response.error);
          showPopup('Payment Failed', response.error.description, 'error');
        });
        razorpayInstance.open();
      }
    } catch (error) {
      console.error('Subscription error:', error);
      showPopup('Subscription Error', error.message, 'error');
    }
  };
  
  const fetchUsdToInrRate = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      return data.rates.INR || 83; // Default to 83 if API fails
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      return 83; // Fallback to 83 INR per USD
    }
  };
  
  // Function to convert USD to INR dynamically
  const convertUsdToInr = async (usdAmount) => {
    const conversionRate = await fetchUsdToInrRate();
    return `₹${(usdAmount * conversionRate).toFixed(2)}`;
  };
  
  // Store Payment Data in Firebase
  const storePaymentDataInFirebase = async (paymentData) => {
    try {
      const db = getDatabase();
      const paymentRef = ref(db, 'payments/' + Date.now());
      const convertedAmount = await convertUsdToInr(paymentData.amount);
      await set(paymentRef, {
        ...paymentData,
        amount: convertedAmount // Convert to INR before storing
      });
      console.log('Payment data stored successfully!');
    } catch (error) {
      console.error('Error storing payment data:', error);
    }
  };
  
  // Store Subscription Data in Firebase
  const storeSubscriptionDataInFirebase = async (subscriptionData) => {
    try {
      const db = getDatabase();
      const subscriptionRef = ref(db, `subscriptions/${user.uid}`);

      const convertedAmount = await convertUsdToInr(subscriptionData.amount);
      await set(subscriptionRef, { ...subscriptionData, amount: convertedAmount });
      console.log('Subscription data stored successfully!');
    } catch (error) {
      console.error('Error storing subscription data:', error);
    }
  };

  // Store cancellation feedback in Firebase
  const storeCancellationFeedback = async (feedback) => {
    try {
      const db = getDatabase();
      const feedbackRef = ref(db, `cancellationFeedback/${user.uid}`);
      await set(feedbackRef, {
        ...feedback,
        timestamp: new Date().toISOString(),
        userId: user.uid,
        email: user.email
      });
      console.log('Cancellation feedback stored successfully!');
    } catch (error) {
      console.error('Error storing cancellation feedback:', error);
    }
  };

  // Handle showing the survey modal
  const handleShowCancellationSurvey = () => {
    console.log("Opening cancellation survey");
    setShowCancellationSurvey(true);
  };

  // Handle survey submission and actual cancellation
  const handleSurveySubmit = async () => {
    try {
      // Store the feedback first
      const feedback = {
        reason: cancellationReason,
        otherReason: cancellationReason === 'other' ? otherReason : '',
        planType: currentPlan,
        subscriptionId: currentSubscriptionId
      };
      await storeCancellationFeedback(feedback);
      
      // Now proceed with the actual cancellation
      await processCancellation();
      setShowCancellationSurvey(false);
      // Reset form fields
      setCancellationReason('');
      setOtherReason('');
    } catch (error) {
      console.error("Error in survey submission:", error);
      showPopup('Error', 'There was an error processing your request. Please try again.', 'error');
    }
  };

  // Process the actual cancellation after feedback
  const processCancellation = async () => {
    if (!currentSubscriptionId) {
      console.error("Subscription ID is undefined!");
      showPopup('Error', 'Cannot find your subscription. Please contact support.', 'error');
      return;
    }

    try {
      const user = getAuth().currentUser;
      if (!user) {
        showPopup('Authentication Required', 'Please log in to cancel your subscription', 'error');
        return;
      }

      const response = await fetch('https://prfecai-backend-592134571427.us-central1.run.app/api/cancelSubscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customerId: user.uid,
          subscriptionId: currentSubscriptionId
        }),
      });

      const data = await response.json();
      if (data.success) {
        showPopup('Success', 'Subscription canceled successfully!', 'success');

        // Remove subscription from Firebase
        const db = getDatabase();
        const subscriptionRef = ref(db, `subscriptions/${user.uid}`);
        await set(subscriptionRef, null); // Clear subscription data

        setCurrentPlan(null); // Update UI state
        setCurrentSubscriptionId(null); // Clear subscription ID
      } else {
        showPopup('Cancellation Failed', data.message || 'Unknown error', 'error');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      showPopup('Error', `Something went wrong: ${error.message}`, 'error');
    }
  };

  // Custom Popup Component
  const CustomPopup = ({ show, title, message, type, onClose }) => {
    if (!show) return null;

    // Define styles based on type
    const getTypeStyles = () => {
      switch (type) {
        case 'success':
          return {
            background: '#4CAF50',
            borderColor: '#2E7D32'
          };
        case 'error':
          return {
            background: '#F44336',
            borderColor: '#C62828'
          };
        case 'warning':
          return {
            background: '#FFC107',
            borderColor: '#FF8F00',
            color: '#333'
          };
        case 'info':
          return {
            background: '#2196F3',
            borderColor: '#1565C0'
          };
        default:
          return {
            background: '#2196F3',
            borderColor: '#1565C0'
          };
      }
    };

    const typeStyles = getTypeStyles();

    return (
      <div 
        className="custom-popup-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingTop: '10vh',
          zIndex: 2000
        }}
        onClick={onClose}
      >
        <div 
          className="custom-popup"
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            width: '400px',
            maxWidth: '90%',
            overflow: 'hidden',
            animation: 'slideDown 0.3s ease-out',
            position: 'relative'
          }}
          onClick={e => e.stopPropagation()}
        >
          <div 
            className="popup-header"
            style={{
              padding: '16px 24px',
              background: typeStyles.background,
              color: type === 'warning' ? '#333' : 'white',
              fontWeight: 'bold',
              borderBottom: `1px solid ${typeStyles.borderColor}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '18px' }}>{title}</h3>
            <span 
              style={{
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: 'bold'
              }}
              onClick={onClose}
            >
              ×
            </span>
          </div>
          <div
            className="popup-content"
            style={{
              padding: '24px',
              fontSize: '16px',
              lineHeight: '1.5'
            }}
          >
            <p style={{ margin: 0 }}>{message}</p>
          </div>
          <div
            className="popup-footer"
            style={{
              padding: '12px 24px',
              borderTop: '1px solid #eee',
              textAlign: 'right'
            }}
          >
            <button
              style={{
                padding: '8px 16px',
                background: typeStyles.background,
                color: type === 'warning' ? '#333' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background 0.2s'
              }}
              onClick={onClose}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='pricing-page'>
      {/* Custom Popup */}
      {/* <CustomPopup
        show={popup.show}
        title={popup.title}
        message={popup.message}
        type={popup.type}
        onClose={() => setPopup(prev => ({ ...prev, show:false }))}
      /> */}

      <div className='pricing-page-container'>
        <div className='pricing-page-heading'>
          <h1>Upgrade your plan</h1>
        </div>
        <div className='pricing-page-tab'>
          <p className={`pricing-tab ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>
            Personal
          </p>
          <p className={`pricing-tab ${activeTab === 'enterprise' ? 'active' : ''}`} onClick={() => setActiveTab('enterprise')}>
            Enterprise
          </p>
        </div>
        {activeTab === 'personal' && (
          <div className='pricing-page-tab-personal'>
            <div className='pricing-page-personal-free'>
              <div className='pricing-page-personal-container-heading'>
                <h1>Free</h1>
                <p>3 prompts for Content Generation</p>
                <p>3 prompts for Keyword Research</p>
                <p>3 prompts for Competitor Analysis</p>
              </div>
              <div className='pricing-page-personal-free-pricing'>
                <p>$0</p>
                {!currentPlan && <button>Your current plan</button>}
              </div>
            </div>
            <div className='pricing-page-personal-starter'>
              <div className='pricing-page-personal-container-heading'>
                <h1>Starter</h1>
                <p>50 prompts for Content Generation</p>
                <p>50 prompts for Keyword Research</p>
                <p>50 prompts for Competitor Analysis</p>
              </div>
              <div className='pricing-page-personal-starter-pricing'>
                <p>$20</p>
                {currentPlan !== 'starter' && <button onClick={() => handleSubscription('starter', 20)}>Get Started</button>}
                {currentPlan === 'starter' && (
                  <div className="current-plan-container">
                    <button style={{ backgroundColor: "inherit", color: "var(--p-color)" }}>Your Current Plan</button>
                    <div className="cancel-subscription-text">
                      <span 
                        onClick={handleShowCancellationSurvey}
                        style={{ cursor: "pointer", textDecoration: "underline", color: "red" }}
                      >
                        Cancel subscription
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className='pricing-page-personal-pro'>
              <div className='pricing-page-personal-container-heading'>
                <h1>Pro</h1>
                <p>150 prompts for Content Generation</p>
                <p>150 prompts for Keyword Research</p>
                <p>150 prompts for Competitor Analysis</p>
              </div>
              <div className='pricing-page-personal-pro-pricing'>
                <p>$45</p>
                {currentPlan !== 'pro' && <button onClick={() => handleSubscription('pro', 45)}>Get Started</button>}
                {currentPlan === 'pro' && (
                  <div className="current-plan-container">
                    <button style={{ backgroundColor: "inherit", color: "var(--p-color)" }}>Your Current Plan</button>
                    <div className="cancel-subscription-text">
                      <span 
                        onClick={handleShowCancellationSurvey}
                        style={{ cursor: "pointer", textDecoration: "underline", color: "red" }}
                      >
                        Cancel subscription
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'enterprise' && (
          <div className='pricing-page-tab-enterprise'>
            <div className='pricing-page-personal-container-heading'>
              <h1>Enterprise</h1>
              <p>Access to collaboration features</p>
              <p>Unlimited Access to all tools</p>
              <p>Enhanced support and account management</p>
            </div>
            <div className='pricing-page-personal-pro-pricing'>
              <Link href='/pricing/contact-sales' style={{width:"max-content",backgroundColor:"black",padding:"10px 12px",fontSize:"16px",color:"white",fontFamily:"var(--p-font)",borderRadius:"8px"}} >Contact sales</Link>
            </div>
          </div>
        )}
      </div>

      {showCancellationSurvey && (
  <div className="cancellation-survey-overlay" onClick={() => setShowCancellationSurvey(false)}>
    <div className="cancellation-survey-modal" onClick={(e) => e.stopPropagation()}>
      <h2>We&apos;re sorry to see you go</h2>
      <p>Please help us understand why you&apos;re cancelling your subscription:</p>

      <div className="survey-options">
        <div className="survey-option">
          <input type="radio" id="too-expensive" name="cancellation-reason" value="too-expensive"
            checked={cancellationReason === 'too-expensive'}
            onChange={() => setCancellationReason('too-expensive')} />
          <label htmlFor="too-expensive">Too expensive</label>
        </div>

        <div className="survey-option">
          <input type="radio" id="not-using" name="cancellation-reason" value="not-using"
            checked={cancellationReason === 'not-using'}
            onChange={() => setCancellationReason('not-using')} />
          <label htmlFor="not-using">Not using it enough</label>
        </div>

        <div className="survey-option">
          <input type="radio" id="missing-features" name="cancellation-reason" value="missing-features"
            checked={cancellationReason === 'missing-features'}
            onChange={() => setCancellationReason('missing-features')} />
          <label htmlFor="missing-features">Missing features I need</label>
        </div>

        <div className="survey-option">
          <input type="radio" id="found-alternative" name="cancellation-reason" value="found-alternative"
            checked={cancellationReason === 'found-alternative'}
            onChange={() => setCancellationReason('found-alternative')} />
          <label htmlFor="found-alternative">Found an alternative service</label>
        </div>

        <div className="survey-option">
          <input type="radio" id="other" name="cancellation-reason" value="other"
            checked={cancellationReason === 'other'}
            onChange={() => setCancellationReason('other')} />
          <label htmlFor="other">Other reason</label>
        </div>

        {cancellationReason === 'other' && (
          <textarea className="other-reason-input" placeholder="Please tell us more..."
            value={otherReason} onChange={(e) => setOtherReason(e.target.value)} />
        )}
      </div>

      <div className="survey-buttons">
        <button className="cancel-survey-btn" onClick={() => setShowCancellationSurvey(false)}>
          Keep My Subscription
        </button>
        <button className="submit-survey-btn" onClick={handleSurveySubmit}
          disabled={!cancellationReason || (cancellationReason === 'other' && !otherReason)}>
          Cancel Subscription
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Pricing;