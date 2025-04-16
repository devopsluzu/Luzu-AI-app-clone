import React from 'react'
import '@styles/footer/Footer.css'
import Image from 'next/image'
import facebookWhite from '@public/Images/footer/facebook-white.png';
import xWhite from '@public/Images/footer/x-white.png';
import Instagram from '@public/Images/footer/instagram-white.png'
import Linkedin from '@public/Images/footer/linkedin-white.png'


export const Footer = () => {
  return (
    <div className='footer'>
        <div className='footer-container'>
            <div className='footer-contents'>
                <p>Terms of Service</p>
                <p>Privacy Policy</p>
                <p>Cookie Policy</p>
                <p>Refund Policy</p>
            </div>
            <div className='footer-socials'>
                <Image src={facebookWhite} alt='facebook'/>
                <Image src={xWhite} alt='X'/>
                <Image src={Instagram} alt='Instagram'/>
                <Image src={Linkedin} alt='Linkedin'/>
            </div>
        </div>
    </div>
  )
}


