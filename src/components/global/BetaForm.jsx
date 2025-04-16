'use client'
import React, { useState } from 'react';
import styles from '@styles/ai/beta-form/BetaForm.module.css';

const BetaForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    profession: '',
    organization: '',
  });

  const [isPopupVisible, setIsPopupVisible] = useState(false); // For showing the popup

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Add a timestamp to the data
    const dataWithTimestamp = {
      ...formData,
      timestamp: new Date().toISOString(),
    };

    // Use firstName as part of the Firebase path
    // const userId = formData.firstName.toLowerCase().replace(/\s+/g, '_'); // Make sure it's unique and sanitized

    // Send data to Firebase Realtime Database with the firstName as the key
    fetch('https://trafyapp-auth-default-rtdb.firebaseio.com/betaUsers.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataWithTimestamp),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Data saved successfully:', data);

        // Show the "Thanks for Submission" popup for 3 seconds
        setIsPopupVisible(true);

        // Reload the page after 3 seconds
        setTimeout(() => {
          window.location.reload(); // Refresh the page
        }, 3000);
      })
      .catch((error) => {
        console.error('Error saving data:', error);
      });

    console.log("Form submitted", dataWithTimestamp);
  };

  return (
    <div className="betaForm">
    <div className="betaFormContainer">
      <div className="betaFormHeadline">
        <h2>Get Started with Luzu AI Enterprise Model</h2>
      </div>
      <form onSubmit={handleSubmit} className="betaFormUserContents">
        <div className="betaFormFullname">
          <input
            type="text"
            placeholder="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="betaFormCredentials">
          <input
            type="email"
            placeholder="Email ID"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            placeholder="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            placeholder="Country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            placeholder="Profession"
            name="profession"
            value={formData.profession}
            onChange={handleChange}
          />
          <input
            type="text"
            placeholder="Organisation / Institute"
            name="organization"
            value={formData.organization}
            onChange={handleChange}
          />
        </div>
        <button type="submit">Submit</button>
      </form>
  
      {/* Popup Message */}
      {isPopupVisible && (
        <div className="popup">
          <p>Thanks for Signing up!</p>
        </div>
      )}
  
      <div className="betaFormContents">
        <p>
          Your information will remain private and secure as per our{" "}
          <a href="/privacy-policy">Privacy Policy</a>.
        </p>
      </div>
    </div>
  </div>
  
  );
};

export default BetaForm;
